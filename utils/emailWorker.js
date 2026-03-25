const nodemailer = require("nodemailer");
const cron       = require("node-cron");
const prisma     = require("../lib/prisma");
const templates  = require("./emailTemplates");

let isRunning = false;

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === "true",
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendQueuedEmail = async (row) => {
  const templateFn = templates[row.template];
  if (!templateFn) throw new Error(`Unknown template: ${row.template}`);

  const templateData = row.templateData || {};
  const attachments  = Array.isArray(row.attachments) ? row.attachments : [];

  const { subject, html } = templateFn(templateData);

  await transporter.sendMail({
    from:        `"DukaPlace" <${process.env.SMTP_USER}>`,
    to:          row.toName ? `"${row.toName}" <${row.toEmail}>` : row.toEmail,
    subject,
    html,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      ...(att.path        ? { path: att.path }                                          : {}),
      ...(att.content     ? { content: att.content, encoding: att.encoding || "base64" } : {}),
      ...(att.contentType ? { contentType: att.contentType }                             : {}),
    })),
  });
};

const processQueue = async () => {
  if (isRunning) {
    console.log("[EmailWorker] ⏭ Skipping — previous run still in progress");
    return;
  }
  isRunning = true;

  try {
    const rows = await prisma.emailQueue.findMany({
      where: {
        status:      "pending",
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take:    20,
    });

    // Filter rows where attempts < maxAttempts (per-row limit)
    const eligible = rows.filter((r) => r.attempts < r.maxAttempts);
    if (!eligible.length) return;

    // Claim rows atomically
    await prisma.emailQueue.updateMany({
      where: { id: { in: eligible.map((r) => r.id) } },
      data:  { attempts: { increment: 1 } },
    });

    for (const row of eligible) {
      try {
        await sendQueuedEmail(row);
        await prisma.emailQueue.update({
          where: { id: row.id },
          data:  { status: "sent", sentAt: new Date() },
        });
        console.log(`[EmailWorker] ✅ Sent → ${row.toEmail} (${row.template})`);
      } catch (err) {
        const totalAttempts = (row.attempts || 0) + 1;
        const newStatus     = totalAttempts >= row.maxAttempts ? "failed" : "pending";
        await prisma.emailQueue.update({
          where: { id: row.id },
          data:  { status: newStatus, errorMessage: err.message },
        });
        console.error(`[EmailWorker] ❌ Failed → ${row.toEmail}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("[EmailWorker] DB error:", err.message);
  } finally {
    isRunning = false;
  }
};

const startEmailWorker = () => {
  cron.schedule("* * * * *", processQueue);
  console.log("✅ Email worker started (runs every minute, overlap-safe)");
};

module.exports = { startEmailWorker, processQueue };
