import { dbConnect } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import DocRecord from "../../models/DocRecord.js";
import ActivityLog from "../../models/ActivityLog.js";
import Ledger from "../../models/Ledger.js";
import Settings from "../../models/Settings.js";
import Task from "../../models/Task.js";
import bcrypt from "bcryptjs";
import { getUserFromReq } from "../../lib/auth.js";
import { generateDocPdf } from "../../lib/pdfTemplates.js";
import { logActivity } from "../../lib/logActivity.js";
import { sendMail, isMailConfigured } from "../../lib/mailer.js";
import { notify } from "../../lib/notify.js";

const TITLES = {
  welcome: "Welcome Packet",
  contract: "Service Agreement / Contract",
  invoice: "Invoice",
  access_request: "Access / Information Request",
  monthly_report: "Monthly Progress Report",
  fulfillment: "Fulfillment & Handover Confirmation",
  feedback_request: "Feedback Request",
  offer_letter: "Offer Letter",
};

const MAX_BASE64_LENGTH = 6_000_000; // ~4.3MB of actual file data

async function doClients(req, res) {
  const clients = await User.find({ role: "client" }).select("-password").sort({ createdAt: -1 });
  const counts = await DocRecord.aggregate([{ $group: { _id: "$client", count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const result = clients.map((c) => ({ ...c.toObject(), docCount: countMap[c._id.toString()] || 0 }));
  res.status(200).json(result);
}

async function doTeamList(req, res) {
  const team = await User.find({ role: "team" }).select("-password").sort({ createdAt: -1 });
  const counts = await Task.aggregate([
    { $group: { _id: { assignedTo: "$assignedTo", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const countMap = {};
  for (const c of counts) {
    const key = c._id.assignedTo.toString();
    if (!countMap[key]) countMap[key] = { todo: 0, in_progress: 0, done: 0 };
    countMap[key][c._id.status] = c.count;
  }
  const result = team.map((t) => ({
    ...t.toObject(),
    taskCounts: countMap[t._id.toString()] || { todo: 0, in_progress: 0, done: 0 },
  }));
  res.status(200).json(result);
}

async function doAllAccounts(req, res) {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.status(200).json(users);
}

async function doUpdateRole(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userId, role } = req.body;
  if (!["admin", "team", "client"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  if (userId === authUser.id) return res.status(400).json({ error: "You can't change your own role." });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "Account not found" });

  const prevRole = user.role;
  user.role = role;
  await user.save();
  await logActivity(user._id, "role_changed", { from: prevRole, to: role }, authUser.id);
  res.status(200).json({ id: user._id, name: user.name, email: user.email, role: user.role });
}

async function doSendDocument(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { clientId, type, meta } = req.body;
  if (!clientId || !type) return res.status(400).json({ error: "clientId and type are required" });

  const client = await User.findById(clientId);
  if (!client) return res.status(404).json({ error: "Client not found" });

  const docMeta = { ...(meta || {}) };
  if (type === "offer_letter" && !docMeta.issuedByName) {
    docMeta.issuedByName = authUser.name;
  }

  const pdfBytes = await generateDocPdf(type, client, docMeta);
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  const title = type === "offer_letter" && docMeta.position
    ? `Offer Letter — ${docMeta.position}`
    : (TITLES[type] || type);

  const doc = await DocRecord.create({
    client: client._id,
    type,
    title,
    meta: docMeta,
    pdfBase64,
    sentBy: authUser.id,
  });

  const isOffer = type === "offer_letter";
  const emailSubject = isOffer
    ? `Your offer from ASHES STACK: ${doc.title}`
    : `New document from ASHES: ${doc.title}`;
  const emailBody = isOffer
    ? `<p>Hi ${client.name},</p>
      <p>Congratulations! We've sent you <b>${doc.title}</b> — it's attached to this email as a PDF, and always available to download from
      <a href="https://ashes-stack.vercel.app/portal">your portal</a>.</p>
      <p>— ASHES STACK</p>`
    : `<p>Hi ${client.name},</p>
      <p>A new document — <b>${doc.title}</b> — has been added to your ASHES Client Portal.</p>
      <p>It's attached to this email as a PDF, and always available at
      <a href="https://ashes-stack.vercel.app/portal">your portal</a>.</p>
      <p>— ASHES</p>`;

  const emailResult = await sendMail({
    to: client.email,
    subject: emailSubject,
    html: emailBody,
    attachments: [{ filename: `${doc.title.replace(/[^a-z0-9]/gi, "_")}.pdf`, content: Buffer.from(pdfBase64, "base64") }],
  });

  res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt, emailSent: emailResult.sent });
  await logActivity(client._id, "document_sent", { type: doc.type, title: doc.title, emailSent: emailResult.sent }, authUser.id);
  await notify(client._id, { type: "document_sent", title: isOffer ? "New offer letter" : "New document", message: doc.title, link: client.role === "team" ? "/team" : "/portal" });
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
    role: ["admin", "team"].includes(role) ? role : "client",
    company: company || undefined,
    project: project || undefined,
    source: source || "other",
    dealValue: dealValue || undefined,
  });

  const emailResult = await sendMail({
    to: cleanEmail,
    subject: user.role === "admin" ? "Your ASHES admin account" : user.role === "team" ? "Your ASHES team account" : "Welcome to your ASHES Client Portal",
    html: `<p>Hi ${name},</p>
      <p>An account has been created for you${company ? ` at ${company}` : ""} on the ASHES ${user.role === "client" ? "client" : user.role} portal.</p>
      <p><b>Login email:</b> ${cleanEmail}<br/><b>Temporary password:</b> ${password}</p>
      <p><a href="https://ashes-stack.vercel.app/login">Log in here</a> — you can change your password anytime from your account settings.</p>
      <p>— ASHES</p>`,
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, emailSent: emailResult.sent });
  await logActivity(user._id, "account_created", { via: "admin_panel", role: user.role, emailSent: emailResult.sent }, authUser.id);
  await notify(user._id, { type: "account_created", title: "Welcome to ASHES", message: "Your account is ready.", link: user.role === "admin" ? "/admin" : user.role === "team" ? "/team" : "/portal" });
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

async function doLedgerList(req, res) {
  const entries = await Ledger.find({}).sort({ date: -1 }).limit(200);
  res.status(200).json(entries);
}

async function doLedgerAdd(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { category, amount, note, date, paid } = req.body;
  if (!["expense", "marketing", "payable", "income"].includes(category)) return res.status(400).json({ error: "Invalid category" });
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: "Amount must be a positive number" });

  const entry = await Ledger.create({
    category,
    amount: amt,
    note: note || undefined,
    date: date ? new Date(date) : new Date(),
    paid: paid === undefined ? true : !!paid, // default: assume already paid, since that's the common case
    createdBy: authUser.id,
  });
  res.status(201).json(entry);
}

async function doLedgerDelete(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "id is required" });
  await Ledger.findByIdAndDelete(id);
  res.status(200).json({ ok: true });
}

async function doLedgerTogglePaid(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id, paid } = req.body;
  const entry = await Ledger.findById(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  entry.paid = !!paid;
  await entry.save();
  res.status(200).json(entry);
}

async function doMailStatus(req, res) {
  res.status(200).json({ configured: isMailConfigured() });
}

async function doTestEmail(req, res, authUser) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isMailConfigured()) {
    return res.status(400).json({ error: "GMAIL_USER / GMAIL_APP_PASSWORD are not set in your environment variables yet." });
  }
  const user = await User.findById(authUser.id);
  const result = await sendMail({
    to: user.email,
    subject: "ASHES — test email",
    html: `<p>If you're reading this, your Gmail integration is working. Documents, files, and new-account emails will now be sent from ${process.env.GMAIL_USER}.</p>`,
  });
  if (!result.sent) return res.status(500).json({ error: result.reason || "Failed to send." });
  res.status(200).json({ ok: true });
}

async function doGetSettings(req, res) {
  let settings = await Settings.findOne({ key: "main" });
  if (!settings) settings = await Settings.create({ key: "main", cashOnHand: 0 });
  res.status(200).json(settings);
}

async function doUpdateSettings(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { cashOnHand } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { key: "main" },
    { cashOnHand: Number(cashOnHand) || 0 },
    { upsert: true, new: true }
  );
  res.status(200).json(settings);
}

const PIPELINE_STAGES = ["lead", "contacted", "demo", "proposal", "won", "in_progress", "delivered", "paid", "review", "repeat_client", "lost"];
const OPEN_STAGES = ["lead", "contacted", "demo", "proposal", "won", "in_progress"];
const CONVERTED_STAGES = ["won", "in_progress", "delivered", "paid", "review", "repeat_client"];

const STAGE_WIN_PROBABILITY = {
  lead: 0.1, contacted: 0.2, demo: 0.35, proposal: 0.55,
  won: 0.85, in_progress: 0.9, delivered: 0.95, paid: 1, review: 1,
};

async function doDashboard(req, res) {
  const clients = await User.find({ role: "client" });
  const invoices = await DocRecord.find({ type: "invoice" }).select("-pdfBase64");
  const ledger = await Ledger.find({});
  const activityLogs = await ActivityLog.find({ action: "stage_changed" });
  let settings = await Settings.findOne({ key: "main" });
  if (!settings) settings = await Settings.create({ key: "main", cashOnHand: 0 });

  // ---- Revenue, computed only from real invoice data (amount lives in meta.amount) ----
  let totalRevenue = 0, outstandingPayments = 0, invoiceCount = 0, invoiceValueSum = 0;
  let totalProjectCosts = 0, costedInvoiceCount = 0, totalProfitOnCostedInvoices = 0;
  const monthlyMap = {};
  const revenueByService = {};
  const revenueByClient = {};
  for (const inv of invoices) {
    const amount = Number(inv.meta?.amount) || 0;
    const cost = inv.meta?.cost !== undefined && inv.meta?.cost !== "" ? Number(inv.meta.cost) : null;
    invoiceCount++;
    invoiceValueSum += amount;
    if (inv.paymentStatus === "paid") {
      totalRevenue += amount;
      const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + amount;
      const service = inv.meta?.service || "Uncategorized";
      revenueByService[service] = (revenueByService[service] || 0) + amount;
      const cid = inv.client.toString();
      revenueByClient[cid] = (revenueByClient[cid] || 0) + amount;
      if (cost !== null) {
        totalProjectCosts += cost;
        costedInvoiceCount++;
        totalProfitOnCostedInvoices += amount - cost;
      }
    } else {
      outstandingPayments += amount;
    }
  }
  const avgProjectValue = invoiceCount ? Math.round(invoiceValueSum / invoiceCount) : 0;
  const costPerProject = costedInvoiceCount ? Math.round(totalProjectCosts / costedInvoiceCount) : null;
  const profitPerProject = costedInvoiceCount ? Math.round(totalProfitOnCostedInvoices / costedInvoiceCount) : null;
  const grossMarginPct = totalRevenue > 0 && costedInvoiceCount ? Math.round(((totalRevenue - totalProjectCosts) / totalRevenue) * 1000) / 10 : null;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleString("en-GB", { month: "short" }), amount: monthlyMap[key] || 0 });
  }

  // ---- Ledger: expenses/marketing/payables (money out) and manual income
  // (money in that isn't from an invoice — e.g. cash payment, other revenue).
  // Same rule for everything: paid/received counts now, unpaid/pending doesn't yet. ----
  let totalExpenses = 0, totalMarketing = 0, accountsPayable = 0, manualIncome = 0, pendingIncome = 0;
  const last3MonthsCutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  let recentCashOut = 0;
  for (const e of ledger) {
    if (e.category === "income") {
      if (e.paid) manualIncome += e.amount;
      else pendingIncome += e.amount;
      continue;
    }
    if (e.paid) {
      if (e.category === "marketing") totalMarketing += e.amount;
      else totalExpenses += e.amount; // expense, or legacy "payable" once paid
      if (new Date(e.date) >= last3MonthsCutoff) recentCashOut += e.amount;
    } else {
      accountsPayable += e.amount; // still owed, not yet real cash out
    }
  }
  totalRevenue += manualIncome;
  const totalCashOut = totalExpenses + totalMarketing;
  const netProfit = totalRevenue - totalCashOut;
  const netMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : null;
  const burnRate = Math.round(recentCashOut / 3); // avg monthly cash out, last 3 months
  const currentCashOnHand = settings.cashOnHand + totalRevenue - totalCashOut;
  const runwayMonths = burnRate > 0 ? Math.round((currentCashOnHand / burnRate) * 10) / 10 : null;
  const cashFlow = totalRevenue - totalCashOut;

  // ---- Pipeline: real stage counts + value of deals still open ----
  const stageCounts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
  let pipelineValue = 0, weightedPipelineValue = 0;
  const sourceCounts = {};
  for (const c of clients) {
    const stage = PIPELINE_STAGES.includes(c.stage) ? c.stage : "lead";
    stageCounts[stage]++;
    const dealVal = Number(c.dealValue) || 0;
    if (OPEN_STAGES.includes(stage)) {
      pipelineValue += dealVal;
      weightedPipelineValue += dealVal * (STAGE_WIN_PROBABILITY[stage] || 0);
    }
    const src = c.source || "other";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }

  const totalClients = clients.length;
  const convertedCount = clients.filter((c) => CONVERTED_STAGES.includes(c.stage)).length;
  const conversionRate = totalClients ? Math.round((convertedCount / totalClients) * 1000) / 10 : 0;
  const repeatClients = stageCounts.repeat_client;
  const lostClients = stageCounts.lost;
  const decidedDeals = convertedCount + lostClients;
  const winRate = decidedDeals ? Math.round((convertedCount / decidedDeals) * 1000) / 10 : null;
  const lossRate = decidedDeals ? Math.round((lostClients / decidedDeals) * 1000) / 10 : null;
  const churnRate = totalClients ? Math.round((lostClients / totalClients) * 1000) / 10 : null;

  // ---- Customer economics ----
  const payingClientIds = Object.keys(revenueByClient);
  const payingClientCount = payingClientIds.length;
  const arpu = totalClients ? Math.round(totalRevenue / totalClients) : 0; // all-time avg revenue per client (lead)
  const revenuePerLead = arpu;
  const revenuePerPayingClient = payingClientCount ? Math.round(totalRevenue / payingClientCount) : 0;
  const ltv = revenuePerPayingClient; // proxy: revenue generated per paying client to date, not a lifetime projection
  const totalMarketingAllTime = totalMarketing;
  const cac = totalClients && totalMarketingAllTime > 0 ? Math.round(totalMarketingAllTime / totalClients) : null;
  const ltvCacRatio = cac && cac > 0 ? Math.round((ltv / cac) * 10) / 10 : null;

  // Repeat purchase / retention: clients with 2+ paid invoices vs clients with 1+ paid invoice
  const paidInvoiceCountByClient = {};
  for (const inv of invoices) {
    if (inv.paymentStatus === "paid") {
      const cid = inv.client.toString();
      paidInvoiceCountByClient[cid] = (paidInvoiceCountByClient[cid] || 0) + 1;
    }
  }
  const repeatPayingClients = Object.values(paidInvoiceCountByClient).filter((n) => n >= 2).length;
  const repeatPurchaseRate = payingClientCount ? Math.round((repeatPayingClients / payingClientCount) * 1000) / 10 : null;
  const retentionRate = totalClients ? Math.round(((totalClients - lostClients) / totalClients) * 1000) / 10 : null;

  // Client concentration risk: biggest single client's share of total revenue
  let biggestClientRevenue = 0;
  for (const cid of payingClientIds) biggestClientRevenue = Math.max(biggestClientRevenue, revenueByClient[cid]);
  const clientConcentrationRisk = totalRevenue > 0 ? Math.round((biggestClientRevenue / totalRevenue) * 1000) / 10 : null;

  // ---- Sales cycle timing ----
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

  // Lead response time: signup -> first stage_changed activity log entry, per client
  const responseTimes = [];
  const firstStageChangeByClient = {};
  for (const log of activityLogs) {
    const cid = log.client.toString();
    if (!firstStageChangeByClient[cid] || new Date(log.createdAt) < new Date(firstStageChangeByClient[cid])) {
      firstStageChangeByClient[cid] = log.createdAt;
    }
  }
  for (const c of clients) {
    const first = firstStageChangeByClient[c._id.toString()];
    if (first) {
      const hours = Math.round(((new Date(first) - new Date(c.createdAt)) / 3600000) * 10) / 10;
      if (hours >= 0) responseTimes.push(hours);
    }
  }
  const avgLeadResponseHours = responseTimes.length ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10 : null;

  // ---- "Today" panel ----
  const staleClients = clients.filter((c) => {
    if (!OPEN_STAGES.includes(c.stage)) return false;
    const daysSinceUpdate = (Date.now() - new Date(c.updatedAt)) / 86400000;
    return daysSinceUpdate >= 7;
  }).length;
  const outstandingInvoiceCount = invoices.filter((inv) => inv.paymentStatus !== "paid").length;

  res.status(200).json({
    // Revenue & profitability
    totalRevenue, outstandingPayments, outstandingInvoiceCount, avgProjectValue,
    grossMarginPct, netProfit, netMarginPct, costPerProject, profitPerProject,
    monthlyEarnings: months, revenueByService,
    accountsReceivable: outstandingPayments,
    accountsPayable,
    manualIncome, pendingIncome,
    totalCashOut,
    // Cash & runway
    cashOnHand: currentCashOnHand, startingCashBalance: settings.cashOnHand, burnRate, runwayMonths, cashFlow, totalExpenses, totalMarketing,
    // Customer economics
    arpu, revenuePerLead, revenuePerPayingClient, ltv, cac, ltvCacRatio,
    repeatPurchaseRate, retentionRate, churnRate, clientConcentrationRisk,
    // Pipeline & sales
    stageCounts, pipelineValue, weightedPipelineValue, sourceCounts, totalClients, payingClientCount,
    conversionRate, repeatClients, winRate, lossRate,
    avgDaysToClose, avgLeadResponseHours,
    // Today
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

  const emailResult = await sendMail({
    to: client.email,
    subject: `New file from ASHES: ${title}`,
    html: `<p>Hi ${client.name},</p>
      <p>A new file — <b>${title}</b> — has been added to your ASHES Client Portal.</p>
      <p>It's attached to this email, and always available at
      <a href="https://ashes-stack.vercel.app/portal">your portal</a>.</p>
      <p>— ASHES</p>`,
    attachments: [{ filename: fileName || title, content: Buffer.from(fileBase64, "base64") }],
  });

  res.status(201).json({ id: doc._id, title: doc.title, type: doc.type, createdAt: doc.createdAt, emailSent: emailResult.sent });
  await logActivity(client._id, "document_sent", { type: "custom_file", title: doc.title, emailSent: emailResult.sent }, authUser.id);
  await notify(client._id, { type: "document_sent", title: "New file", message: doc.title, link: "/portal" });
}

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await dbConnect();

  const { action } = req.query;
  try {
    if (action === "clients") return await doClients(req, res);
    if (action === "team-list") return await doTeamList(req, res);
    if (action === "all-accounts") return await doAllAccounts(req, res);
    if (action === "update-role") return await doUpdateRole(req, res, authUser);
    if (action === "send-document") return await doSendDocument(req, res, authUser);
    if (action === "create-user") return await doCreateUser(req, res, authUser);
    if (action === "activity") return await doActivity(req, res);
    if (action === "upload-file") return await doUploadFile(req, res, authUser);
    if (action === "dashboard") return await doDashboard(req, res);
    if (action === "update-client") return await doUpdateClient(req, res, authUser);
    if (action === "ledger-list") return await doLedgerList(req, res);
    if (action === "ledger-add") return await doLedgerAdd(req, res, authUser);
    if (action === "ledger-delete") return await doLedgerDelete(req, res);
    if (action === "ledger-toggle-paid") return await doLedgerTogglePaid(req, res);
    if (action === "get-settings") return await doGetSettings(req, res);
    if (action === "update-settings") return await doUpdateSettings(req, res);
    if (action === "mail-status") return await doMailStatus(req, res);
    if (action === "test-email") return await doTestEmail(req, res, authUser);
    return res.status(404).json({ error: "Unknown admin action" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
