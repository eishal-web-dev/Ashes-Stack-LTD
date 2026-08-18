import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import DocRecord from "../../models/DocRecord.js";
import ActivityLog from "../../models/ActivityLog.js";
import bcrypt from "bcryptjs";
import { getUserFromReq } from "../../lib/auth.js";
import { generateDocPdf } from "../../lib/pdfTemplates.js";
import { logActivity } from "../../lib/logActivity.js";

const TITLES = {
  welcome: "Welcome Packet",
  contract: "Service Agreement / Contract",
  invoice: "Invoice",
  access_request: "Access / Information Request",
  monthly_report: "Monthly Progress Report",
  fulfillment: "Fulfillment & Handover Confirmation",
  feedback_request: "Feedback Request",
};

const MAX_BASE64_LENGTH = 6_000_000; // ~4.3MB of actual file data

async function doClients(req, res) {
  const clients = await User.find({ role: "client" }).select("-password").sort({ createdAt: -1 });
  const counts = await DocRecord.aggregate([{ $group: { _id: "$client", count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const result = clients.map((c) => ({ ...c.toObject(), docCount: countMap[c._id.toString()] || 0 }));
  res.status(200).json(result);
}

async function doSendDocument(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { clientId, type, meta } = req.body;
  if (!clientId || !type) return res.status(400).json({ error: "clientId and type are required" });

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const pdfBytes = await generateDocPdf(type, client, meta || {});
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  const doc = await DocRecord.create({
    client: client._id,
    type,
    title: TITLES[type] || type,
    meta: meta || {},
    pdfBase64,
    sentBy: authUser.id,
  });

  res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt });
  await logActivity(client._id, "document_sent", { type: doc.type, title: doc.title }, authUser.id);
}

async function doCreateUser(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, email, password, role, company, project, source, dealValue } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters." });
  }
  const cleanEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: cleanEmail });
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashed,
    role: role === "admin" ? "admin" : "client",
    company: company || undefined,
    project: project || undefined,
    source: source || "other",
    dealValue: dealValue || undefined,
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  await logActivity(user._id, "account_created", { via: "admin_panel", role: user.role }, authUser.id);
}

async function doUpdateClient(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { clientId, stage, source, dealValue } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const prevStage = client.stage;
  if (stage !== undefined) client.stage = stage;
  if (source !== undefined) client.source = source;
  if (dealValue !== undefined) client.dealValue = dealValue;
  await client.save();

  if (stage !== undefined && stage !== prevStage) {
    await logActivity(client._id, "stage_changed", { from: prevStage, to: stage }, authUser.id);
  }

  res.status(200).json({ id: client._id, stage: client.stage, source: client.source, dealValue: client.dealValue });
}

const PIPELINE_STAGES = ["lead", "contacted", "demo", "proposal", "won", "in_progress", "delivered", "paid", "review", "repeat_client", "lost"];
const OPEN_STAGES = ["lead", "contacted", "demo", "proposal", "won", "in_progress"];
const CONVERTED_STAGES = ["won", "in_progress", "delivered", "paid", "review", "repeat_client"];

async function doDashboard(req, res) {
  const clients = await User.find({ role: "client" });
  const invoices = await DocRecord.find({ type: "invoice" }).select("-pdfBase64");

  // Revenue, computed only from real invoice data (amount lives in meta.amount).
  let totalRevenue = 0, outstandingPayments = 0, invoiceCount = 0, invoiceValueSum = 0;
  const monthlyMap = {}; // "2026-08" -> amount
  for (const inv of invoices) {
    const amount = Number(inv.meta?.amount) || 0;
    invoiceCount++;
    invoiceValueSum += amount;
    if (inv.paymentStatus === "paid") {
      totalRevenue += amount;
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + amount;
    } else {
      outstandingPayments += amount;
    }
  }
  const avgProjectValue = invoiceCount ? Math.round(invoiceValueSum / invoiceCount) : 0;

  // Last 6 months of earnings, oldest first, zero-filled.
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleString("en-GB", { month: "short" }), amount: monthlyMap[key] || 0 });
  }

  // Pipeline: real stage counts + value of deals still open.
  const stageCounts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
  let pipelineValue = 0;
  const sourceCounts = {};
  for (const c of clients) {
    const stage = PIPELINE_STAGES.includes(c.stage) ? c.stage : "lead";
    stageCounts[stage]++;
    if (OPEN_STAGES.includes(stage)) pipelineValue += Number(c.dealValue) || 0;
    const src = c.source || "other";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }

  const totalClients = clients.length;
  const convertedCount = clients.filter((c) => CONVERTED_STAGES.includes(c.stage)).length;
  const conversionRate = totalClients ? Math.round((convertedCount / totalClients) * 1000) / 10 : 0;
  const repeatClients = stageCounts.repeat_client;

  // Avg days lead->paid, only for clients with at least one paid invoice.
  const closeDurations = [];
  for (const c of clients) {
    const paidInvoicesForClient = invoices.filter((inv) => inv.client.toString() === c._id.toString() && inv.paymentStatus === "paid" && inv.paidAt);
    if (paidInvoicesForClient.length) {
      const earliestPaid = paidInvoicesForClient.reduce((a, b) => (new Date(a.paidAt) < new Date(b.paidAt) ? a : b));
      const days = Math.round((new Date(earliestPaid.paidAt) - new Date(c.createdAt)) / 86400000);
      if (days >= 0) closeDurations.push(days);
    }
  }
  const avgDaysToClose = closeDurations.length ? Math.round(closeDurations.reduce((a, b) => a + b, 0) / closeDurations.length) : null;

  // "Today" panel — clients whose stage hasn't moved in 7+ days and aren't done/lost.
  const staleClients = clients.filter((c) => {
    if (!OPEN_STAGES.includes(c.stage)) return false;
    const daysSinceUpdate = (Date.now() - new Date(c.updatedAt)) / 86400000;
    return daysSinceUpdate >= 7;
  }).length;
  const outstandingInvoiceCount = invoices.filter((inv) => inv.paymentStatus !== "paid").length;

  res.status(200).json({
    totalRevenue,
    outstandingPayments,
    outstandingInvoiceCount,
    avgProjectValue,
    monthlyEarnings: months,
    stageCounts,
    pipelineValue,
    sourceCounts,
    totalClients,
    conversionRate,
    repeatClients,
    avgDaysToClose,
    staleClients,
  });
}

async function doActivity(req, res) {
  const { clientId } = req.query;
  const filter = clientId ? { client: clientId } : {};
  const logs = await ActivityLog.find(filter).populate("actor", "name role").sort({ createdAt: -1 }).limit(100);
  res.status(200).json(logs);
}

async function doUploadFile(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { clientId, title, fileName, mimeType, fileBase64 } = req.body;
  if (!clientId || !title || !fileBase64) {
    return res.status(400).json({ error: "clientId, title and fileBase64 are required" });
  }
  if (fileBase64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({
      error: "File is too large for direct upload (limit ~4MB). For videos or large files, share a Google Drive/WeTransfer link instead, or ask about adding cloud file storage.",
    });
  }

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const doc = await DocRecord.create({
    client: client._id,
    type: "custom_file",
    title,
    fileName: fileName || title,
    mimeType: mimeType || "application/octet-stream",
    pdfBase64: fileBase64,
    sentBy: authUser.id,
  });

  res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt });
}

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  const { action } = req.query;
  try {
    if (action === "clients") return await doClients(req, res);
    if (action === "send-document") return await doSendDocument(req, res, authUser);
    if (action === "create-user") return await doCreateUser(req, res, authUser);
    if (action === "activity") return await doActivity(req, res);
    if (action === "upload-file") return await doUploadFile(req, res, authUser);
    if (action === "dashboard") return await doDashboard(req, res);
    if (action === "update-client") return await doUpdateClient(req, res, authUser);
    return res.status(404).json({ error: "Unknown admin action" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
