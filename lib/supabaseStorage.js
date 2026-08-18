const trimSlash = (value = "") => value.replace(/\/+$/, "");

export function storageConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_STORAGE_BUCKET
  );
}

function config() {
  const url = trimSlash(process.env.SUPABASE_URL || "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "";
  if (!url || !key || !bucket) {
    throw new Error("Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET.");
  }
  return { url, key, bucket };
}

function safePart(value = "file") {
  return String(value)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "file";
}

export function documentStoragePath(doc) {
  const owner = safePart(doc.client?.toString?.() || "unknown");
  const id = safePart(doc._id?.toString?.() || `${Date.now()}`);
  const fileName = safePart(doc.fileName || `${doc.title || "document"}.pdf`);
  return `documents/${owner}/${id}/${fileName}`;
}

export async function uploadBuffer(path, buffer, mimeType = "application/octet-stream") {
  const { url, key, bucket } = config();
  const endpoint = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": mimeType,
      "x-upsert": "true",
      "Cache-Control": "3600",
    },
    body: buffer,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase upload failed (${response.status}): ${detail || response.statusText}`);
  }
  return path;
}

export async function downloadBuffer(path) {
  const { url, key, bucket } = config();
  const endpoint = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase download failed (${response.status}): ${detail || response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(path) {
  if (!storageConfigured() || !path) return;
  const { url, key, bucket } = config();
  const endpoint = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase delete failed (${response.status}): ${detail || response.statusText}`);
  }
}

export async function getDocumentBuffer(doc) {
  if (doc.storagePath) return downloadBuffer(doc.storagePath);
  if (doc.pdfBase64) return Buffer.from(doc.pdfBase64, "base64");
  throw new Error("Document file content is missing.");
}
