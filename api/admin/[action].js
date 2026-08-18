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
  const { name, email, password, role, company, project } = req.body;
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
  });

  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  await logActivity(user._id, "account_created", { via: "admin_panel", role: user.role }, authUser.id);
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
    return res.status(404).json({ error: "Unknown admin action" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
