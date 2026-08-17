import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_BYTES = readFileSync(path.join(__dirname, "assets", "logo.png"));
const LOGO_ASPECT = 900 / 365; // width / height of the source logo file

const ORANGE = rgb(0.98, 0.45, 0.25); // #FA7340-ish, matches ASHES accent
const BLACK = rgb(0.06, 0.06, 0.06);
const GRAY = rgb(0.35, 0.35, 0.35);
const LIGHT = rgb(0.95, 0.94, 0.91);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 50;

function fmtDate(d) {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString("en-GB");
}

async function newDoc() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(LOGO_BYTES);
  return { pdf, font, bold, logo };
}

function addHeader(page, bold, font, label, logo) {
  // header box
  page.drawRectangle({ x: MARGIN, y: PAGE_H - 90, width: PAGE_W - MARGIN * 2, height: 40, color: rgb(1, 1, 1), borderColor: BLACK, borderWidth: 1 });
  const logoHeight = 16;
  const logoWidth = logoHeight * LOGO_ASPECT;
  const boxCenterY = (PAGE_H - 90) + 20; // vertical center of the 40pt-tall header box
  page.drawImage(logo, { x: MARGIN + 14, y: boxCenterY - logoHeight / 2, width: logoWidth, height: logoHeight });
  const labelWidth = font.widthOfTextAtSize(label, 8);
  page.drawText(label, { x: PAGE_W - MARGIN - labelWidth - 14, y: PAGE_H - 72, size: 8, font: bold, color: GRAY });
  // orange divider bar
  page.drawRectangle({ x: MARGIN, y: PAGE_H - 130, width: PAGE_W - MARGIN * 2, height: 22, color: ORANGE });
}

function addFooter(page, font) {
  page.drawText("ASHES STACK  •  SOFTWARE HOUSE  •  CONFIDENTIAL CLIENT DOCUMENT", {
    x: MARGIN,
    y: 30,
    size: 7,
    font,
    color: GRAY,
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function baseDocument({ label, eyebrow, title, subtitle, client, sections }) {
  const { pdf, font, bold, logo } = await newDoc();
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  addHeader(page, bold, font, label, logo);
  addFooter(page, font);

  let y = PAGE_H - 165;
  page.drawText(eyebrow, { x: MARGIN, y, size: 9, font: bold, color: ORANGE });
  y -= 24;
  page.drawText(title, { x: MARGIN, y, size: 22, font: bold, color: BLACK });
  y -= 20;
  if (subtitle) {
    page.drawText(subtitle, { x: MARGIN, y, size: 10, font, color: GRAY });
    y -= 20;
  }

  // client info box
  page.drawRectangle({ x: MARGIN, y: y - 55, width: PAGE_W - MARGIN * 2, height: 55, color: LIGHT });
  page.drawText(`CLIENT:  ${client.company || client.name}`, { x: MARGIN + 12, y: y - 20, size: 10, font: bold, color: BLACK });
  page.drawText(`CONTACT: ${client.name}  •  ${client.email}`, { x: MARGIN + 12, y: y - 36, size: 9, font, color: GRAY });
  page.drawText(`DATE: ${fmtDate(new Date())}`, { x: MARGIN + 12, y: y - 50, size: 9, font, color: GRAY });
  y -= 75;

  const ensureRoom = (needed) => {
    if (y - needed < 60) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      addFooter(page, font);
      y = PAGE_H - 60;
    }
  };

  for (const section of sections) {
    ensureRoom(30);
    if (section.heading) {
      page.drawText(section.heading, { x: MARGIN, y, size: 13, font: bold, color: BLACK });
      y -= 18;
    }
    if (section.paragraph) {
      const lines = wrapText(section.paragraph, font, 10, PAGE_W - MARGIN * 2);
      for (const line of lines) {
        ensureRoom(14);
        page.drawText(line, { x: MARGIN, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 14;
      }
      y -= 6;
    }
    if (section.bullets) {
      for (const b of section.bullets) {
        const lines = wrapText(b, font, 10, PAGE_W - MARGIN * 2 - 14);
        ensureRoom(14 * lines.length);
        page.drawText("•", { x: MARGIN, y, size: 10, font: bold, color: ORANGE });
        lines.forEach((line, i) => {
          page.drawText(line, { x: MARGIN + 14, y: y - i * 14, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        });
        y -= 14 * lines.length + 4;
      }
      y -= 4;
    }
    if (section.table) {
      const { headers, rows } = section.table;
      const colW = (PAGE_W - MARGIN * 2) / headers.length;
      ensureRoom(20);
      page.drawRectangle({ x: MARGIN, y: y - 18, width: PAGE_W - MARGIN * 2, height: 20, color: BLACK });
      headers.forEach((h, i) => {
        page.drawText(h, { x: MARGIN + i * colW + 6, y: y - 13, size: 9, font: bold, color: rgb(1, 1, 1) });
      });
      y -= 22;
      rows.forEach((row, ri) => {
        ensureRoom(20);
        if (ri % 2 === 0) {
          page.drawRectangle({ x: MARGIN, y: y - 15, width: PAGE_W - MARGIN * 2, height: 18, color: LIGHT });
        }
        row.forEach((cell, i) => {
          page.drawText(String(cell), { x: MARGIN + i * colW + 6, y: y - 11, size: 9, font, color: BLACK });
        });
        y -= 18;
      });
      y -= 10;
    }
    y -= 6;
  }

  return pdf.save();
}

export async function generateDocPdf(type, client, meta = {}) {
  switch (type) {
    case "welcome":
      return baseDocument({
        label: "WELCOME PACKET",
        eyebrow: "CLIENT ONBOARDING",
        title: `Welcome to ASHES, ${client.name}!`,
        subtitle: "We're excited to start working with you.",
        client,
        sections: [
          {
            heading: "What happens next",
            bullets: [
              "We'll confirm your project scope and creative direction.",
              "You'll receive a free demo/concept before any payment is due.",
              "Once you approve the demo, we begin the paid production phase.",
              "You can track every document (invoices, contracts, reports) in your Client Portal.",
            ],
          },
          {
            heading: "Your point of contact",
            paragraph: `For anything related to your project (${client.project || "your project"}), reach out via WhatsApp or email and we'll respond promptly.`,
          },
          {
            heading: "Google Meet",
            paragraph: meta.googleEmail
              ? `We'll send Google Meet invites to ${meta.googleEmail} for kickoff and review calls.`
              : "Add your Gmail address in your portal profile so we can send Google Meet invites for calls.",
          },
        ],
      });

    case "contract":
      return baseDocument({
        label: "SERVICE AGREEMENT",
        eyebrow: "CLIENT AGREEMENT",
        title: meta.title || "Landing Page Service Agreement",
        subtitle: `${client.company || client.name} × ASHES • Editable commercial agreement`,
        client,
        sections: [
          {
            heading: "1. Scope of Work",
            bullets: meta.scope || [
              "Production and editing of ONE short-form video advertisement.",
              "Delivered for Instagram, TikTok, LinkedIn, Google Ads and YouTube using one agreed master format.",
              "Includes cinematic editing, transitions, motion graphics, captions/text overlays, logo/brand placement, sound design, and music as appropriate to the approved concept.",
              "Up to two reasonable revision rounds are included after demo approval.",
            ],
          },
          {
            heading: "2. Demo, Approval & Fee",
            paragraph: `ASHES presents a free demo/concept first. No payment is due unless the client approves the demo in writing and requests the paid project to proceed. Agreed project fee: ${meta.fee || "PKR 5,000"}.`,
          },
          {
            heading: "3. Not Included",
            bullets: meta.exclusions || [
              "Advertising spend, media buying, campaign setup or performance guarantees.",
              "On-site filming, travel, actors or physical production unless separately agreed.",
              "Paid stock footage, premium music/plugins or third-party licence costs.",
              "Ongoing monthly content creation or account management unless separately quoted.",
            ],
          },
          {
            heading: "4. Acceptance",
            paragraph: "By approving this document in your Client Portal, both parties confirm the scope and terms above.",
          },
        ],
      });

    case "invoice": {
      const items = meta.items && meta.items.length ? meta.items : [
        { desc: meta.project || "Project fee", qty: 1, price: meta.amount || 5000 },
      ];
      const total = items.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0);
      return baseDocument({
        label: "INVOICE",
        eyebrow: `INVOICE #${meta.invoiceNumber || "0001"}`,
        title: "Invoice",
        subtitle: `Due date: ${meta.dueDate ? fmtDate(meta.dueDate) : fmtDate()}`,
        client,
        sections: [
          {
            table: {
              headers: ["DESCRIPTION", "QTY", "UNIT PRICE (PKR)", "TOTAL (PKR)"],
              rows: items.map((it) => [it.desc, it.qty, Number(it.price).toLocaleString(), (it.qty * it.price).toLocaleString()]),
            },
          },
          {
            heading: `Total Due: PKR ${total.toLocaleString()}`,
          },
          {
            paragraph: meta.paymentInstructions || "Payment via bank transfer / JazzCash / Easypaisa — details to be shared separately. Final files are released after full payment.",
          },
        ],
      });
    }

    case "access_request":
      return baseDocument({
        label: "ACCESS REQUEST",
        eyebrow: "ACTION NEEDED",
        title: "Access / Information Request",
        subtitle: "Please provide the following so we can continue your project.",
        client,
        sections: [
          {
            heading: "Requested items",
            bullets: meta.items || [
              "Logo files and brand assets (PNG/SVG, high resolution).",
              "Any client-owned photos or video to be used in the ad.",
              "Ad account access via official invite (not password sharing), if applicable.",
              "Confirmation of offer wording / claims to be used in the advert.",
            ],
          },
          {
            paragraph: "Please upload or send these via WhatsApp/email, or reply directly in your Client Portal.",
          },
        ],
      });

    case "monthly_report":
      return baseDocument({
        label: "MONTHLY REPORT",
        eyebrow: `REPORT — ${meta.month || new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
        title: "Monthly Progress Report",
        client,
        sections: [
          {
            heading: "Summary",
            paragraph: meta.summary || "Here's a summary of the work completed this month and what's planned next.",
          },
          {
            heading: "Completed this month",
            bullets: meta.completed || ["Demo concept delivered and reviewed.", "Revision round completed."],
          },
          {
            heading: "Planned next",
            bullets: meta.planned || ["Finalize export and handover files."],
          },
        ],
      });

    case "fulfillment":
      return baseDocument({
        label: "FULFILLMENT NOTICE",
        eyebrow: "PROJECT DELIVERED",
        title: "Fulfillment & Handover Confirmation",
        client,
        sections: [
          {
            paragraph: meta.summary || "This confirms that the agreed deliverables for your project have been completed and handed over.",
          },
          {
            heading: "Delivered",
            bullets: meta.delivered || ["Final approved video export.", "Source/agreed project files for this engagement."],
          },
          {
            paragraph: "Third-party materials (stock, licensed assets) remain subject to their own licences and are excluded from this handover unless separately agreed.",
          },
        ],
      });

    case "feedback_request":
      return baseDocument({
        label: "FEEDBACK REQUEST",
        eyebrow: "WE'D LOVE YOUR INPUT",
        title: "Quick Feedback Request",
        client,
        sections: [
          {
            paragraph: meta.message || "We'd appreciate a few minutes of your time to share feedback on the work delivered so far.",
          },
          {
            heading: "A few questions",
            bullets: meta.questions || [
              "How satisfied are you with the delivered concept? (1-5)",
              "Was communication clear and timely throughout the project?",
              "Anything you'd like us to improve next time?",
            ],
          },
          {
            paragraph: "Reply in your Client Portal or via WhatsApp/email — thank you!",
          },
        ],
      });

    default:
      throw new Error("Unknown document type: " + type);
  }
}
