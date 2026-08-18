import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_BYTES = readFileSync(path.join(__dirname, "assets", "logo.png"));
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 52;
const ORANGE = rgb(0.98, 0.45, 0.25);
const BLACK = rgb(0.055, 0.055, 0.06);
const GRAY = rgb(0.38, 0.38, 0.4);
const PALE = rgb(0.965, 0.955, 0.93);

function clean(v) {
  return String(v ?? "").replace(/[^\x20-\xFF]/g, " ").replace(/\s+/g, " ").trim();
}
function date(v) {
  return new Date(v || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}
function wrap(text, font, size, width) {
  const words = clean(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateTeamAppointmentPdf(team, meta = {}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(LOGO_BYTES);
  const page = pdf.addPage([PAGE_W, PAGE_H]);

  page.drawRectangle({ x: 0, y: PAGE_H - 12, width: PAGE_W, height: 12, color: ORANGE });
  page.drawImage(logo, { x: M, y: PAGE_H - 83, width: 98, height: 39 });
  page.drawText("APPOINTMENT LETTER", { x: PAGE_W - M - 122, y: PAGE_H - 60, size: 9, font: bold, color: GRAY });
  page.drawText("ASHES · CREATIVE SOFTWARE HOUSE", { x: PAGE_W - M - 172, y: PAGE_H - 76, size: 7, font, color: GRAY });
  page.drawLine({ start: { x: M, y: PAGE_H - 104 }, end: { x: PAGE_W - M, y: PAGE_H - 104 }, thickness: 1, color: rgb(.84,.82,.78) });

  let y = PAGE_H - 145;
  page.drawText("OFFICIAL APPOINTMENT", { x: M, y, size: 9, font: bold, color: ORANGE });
  y -= 30;
  page.drawText(`Welcome to ASHES, ${clean(team.name)}`, { x: M, y, size: 22, font: bold, color: BLACK });
  y -= 22;
  page.drawText(`Issued ${date(meta.issueDate)}`, { x: M, y, size: 9, font, color: GRAY });
  y -= 30;

  page.drawRectangle({ x: M, y: y - 74, width: PAGE_W - M * 2, height: 74, color: PALE });
  page.drawText("TEAM MEMBER", { x: M + 14, y: y - 20, size: 7, font: bold, color: ORANGE });
  page.drawText(clean(team.name), { x: M + 14, y: y - 38, size: 12, font: bold, color: BLACK });
  page.drawText(clean(`${meta.title || team.teamTitle || "Team Member"} · ${meta.department || team.department || "ASHES"}`), { x: M + 14, y: y - 55, size: 9, font, color: GRAY });
  page.drawText(clean(team.email), { x: M + 14, y: y - 68, size: 8, font, color: GRAY });
  y -= 104;

  const intro = meta.intro || `We are pleased to appoint you as ${meta.title || team.teamTitle || "Team Member"} at ASHES. Your appointment reflects our confidence in your skills, professionalism and ability to contribute to the work we build for our clients and products.`;
  for (const line of wrap(intro, font, 10, PAGE_W - M * 2)) {
    page.drawText(line, { x: M, y, size: 10, font, color: BLACK });
    y -= 15;
  }
  y -= 14;

  const rows = [
    ["POSITION", meta.title || team.teamTitle || "Team Member"],
    ["DEPARTMENT", meta.department || team.department || "Delivery"],
    ["START DATE", date(meta.startDate || team.startedAt)],
    ["EMPLOYMENT STATUS", meta.employmentStatus || team.employmentStatus || "Active"],
    ["COMPENSATION", `${meta.salaryCurrency || team.salaryCurrency || "PKR"} ${Number(meta.salaryAmount ?? team.salaryAmount ?? 0).toLocaleString()} / ${meta.salaryFrequency || team.salaryFrequency || "month"}`],
  ];
  for (const [label, value] of rows) {
    page.drawText(label, { x: M, y, size: 7, font: bold, color: ORANGE });
    page.drawText(clean(value), { x: M + 126, y, size: 9, font: bold, color: BLACK });
    page.drawLine({ start: { x: M, y: y - 7 }, end: { x: PAGE_W - M, y: y - 7 }, thickness: .5, color: rgb(.88,.86,.82) });
    y -= 27;
  }
  y -= 8;

  page.drawText("TERMS & EXPECTATIONS", { x: M, y, size: 10, font: bold, color: BLACK });
  y -= 20;
  const bullets = meta.terms || [
    "Carry out assigned responsibilities professionally and communicate progress clearly.",
    "Protect confidential company, client and internal information.",
    "Follow ASHES quality standards, deadlines and internal working procedures.",
    "Compensation, responsibilities and working arrangements may be updated through written agreement.",
  ];
  for (const bullet of bullets) {
    const lines = wrap(bullet, font, 9, PAGE_W - M * 2 - 18);
    page.drawCircle({ x: M + 4, y: y + 3, size: 2, color: ORANGE });
    lines.forEach((line, i) => page.drawText(line, { x: M + 15, y: y - i * 13, size: 9, font, color: BLACK }));
    y -= lines.length * 13 + 8;
  }

  y -= 12;
  const closing = meta.closing || "We are glad to have you with ASHES and look forward to building remarkable work together.";
  for (const line of wrap(closing, font, 10, PAGE_W - M * 2)) {
    page.drawText(line, { x: M, y, size: 10, font, color: BLACK }); y -= 15;
  }

  y -= 30;
  page.drawText("For ASHES", { x: M, y, size: 8, font, color: GRAY });
  y -= 19;
  page.drawText(clean(meta.signatoryName || "ASHES Administration"), { x: M, y, size: 11, font: bold, color: BLACK });
  page.drawText(clean(meta.signatoryTitle || "Owner / Administration"), { x: M, y: y - 15, size: 8, font, color: GRAY });

  page.drawLine({ start: { x: PAGE_W - M - 160, y: y - 5 }, end: { x: PAGE_W - M, y: y - 5 }, thickness: .8, color: GRAY });
  page.drawText("Team Member Signature", { x: PAGE_W - M - 160, y: y - 20, size: 7, font, color: GRAY });

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 33, color: BLACK });
  page.drawText("ASHES · CONFIDENTIAL HR DOCUMENT", { x: M, y: 13, size: 7, font: bold, color: rgb(1,1,1) });
  page.drawText("Built to work. Made to be remembered.", { x: PAGE_W - M - 151, y: 13, size: 7, font, color: rgb(.75,.75,.75) });

  return pdf.save();
}
