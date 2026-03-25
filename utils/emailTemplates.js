/**
 * Email Templates
 * Each template receives a `data` object with dynamic values.
 * Returns { subject, html }
 */

const BASE_COLOR = "#16a34a";       // primary green
const BASE_BG = "#f9fafb";          // muted background
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#111827";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const DANGER = "#dc2626";

const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DukaPlace</title>
</head>
<body style="margin:0;padding:0;background:${BASE_BG};font-family:'Segoe UI',Arial,sans-serif;color:${TEXT_PRIMARY};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BASE_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:${CARD_BG};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${BASE_COLOR};padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">DukaPlace</p>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Your trusted marketplace</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BORDER};background:${BASE_BG};">
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};text-align:center;">
                &copy; ${new Date().getFullYear()} DukaPlace. All rights reserved.<br/>
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const btn = (text, url) => `
  <a href="${url}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:${BASE_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">${text}</a>
`;

const divider = () => `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;"/>`;

const heading = (text) => `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${TEXT_PRIMARY};">${text}</h2>`;

const para = (text) => `<p style="margin:8px 0;font-size:15px;line-height:1.6;color:${TEXT_PRIMARY};">${para}</p>`;

// ─── Templates ────────────────────────────────────────────────────────────────

const templates = {

  /**
   * Welcome email on registration
   * data: { name, role, loginUrl }
   */
  welcome: (data) => ({
    subject: `Welcome to DukaPlace, ${data.name}!`,
    html: layout(`
      ${heading(`Welcome, ${data.name}! 🎉`)}
      <p style="margin:8px 0 0;font-size:15px;color:${TEXT_MUTED};">Your account has been created successfully.</p>
      ${divider()}
      <p style="font-size:15px;line-height:1.7;color:${TEXT_PRIMARY};">
        You've joined DukaPlace as a <strong>${data.role}</strong>. 
        ${data.role === "seller"
          ? "You can now create listings and start selling to thousands of buyers."
          : "You can now browse products, place orders, and track deliveries."}
      </p>
      <table style="margin-top:20px;width:100%;border:1px solid ${BORDER};border-radius:8px;border-collapse:collapse;">
        <tr style="background:${BASE_BG};">
          <td style="padding:10px 16px;font-size:13px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER};">Account Type</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;border-bottom:1px solid ${BORDER};">${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;color:${TEXT_MUTED};">Email</td>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;">${data.email}</td>
        </tr>
      </table>
      ${btn("Go to DukaPlace", data.loginUrl || "http://localhost:8080/auth")}
    `),
  }),

  /**
   * OTP / password reset token email
   * data: { name, otp, expiresInMinutes }
   */
  otp: (data) => ({
    subject: `Your DukaPlace password reset code`,
    html: layout(`
      ${heading("Password Reset Request")}
      <p style="margin:8px 0 0;font-size:15px;color:${TEXT_MUTED};">Hi ${data.name}, use the code below to reset your password.</p>
      ${divider()}
      <p style="font-size:14px;color:${TEXT_PRIMARY};margin-bottom:12px;">Your one-time reset code:</p>
      <div style="text-align:center;margin:8px 0 20px;">
        <span style="display:inline-block;padding:16px 40px;background:${BASE_BG};border:2px dashed ${BASE_COLOR};border-radius:10px;font-size:36px;font-weight:800;letter-spacing:10px;color:${BASE_COLOR};">${data.otp}</span>
      </div>
      <p style="font-size:13px;color:${TEXT_MUTED};text-align:center;">
        This code expires in <strong>${data.expiresInMinutes || 60} minutes</strong>.
      </p>
      ${divider()}
      <p style="font-size:13px;color:${DANGER};">
        ⚠️ If you did not request a password reset, please ignore this email. Your account is safe.
      </p>
    `),
  }),

  /**
   * Password changed confirmation
   * data: { name, changedAt, supportEmail }
   */
  passwordChanged: (data) => ({
    subject: `Your DukaPlace password was changed`,
    html: layout(`
      ${heading("Password Changed Successfully")}
      <p style="margin:8px 0 0;font-size:15px;color:${TEXT_MUTED};">Hi ${data.name}, your password has been updated.</p>
      ${divider()}
      <p style="font-size:15px;line-height:1.7;color:${TEXT_PRIMARY};">
        Your DukaPlace account password was successfully changed on <strong>${data.changedAt || new Date().toLocaleString()}</strong>.
      </p>
      <p style="font-size:15px;line-height:1.7;color:${TEXT_PRIMARY};">
        If you made this change, no further action is needed.
      </p>
      ${divider()}
      <p style="font-size:13px;color:${DANGER};">
        ⚠️ If you did not change your password, contact us immediately at 
        <a href="mailto:${data.supportEmail || "support@dukaplace.com"}" style="color:${DANGER};">${data.supportEmail || "support@dukaplace.com"}</a>.
      </p>
    `),
  }),

  /**
   * Generic / custom email
   * data: { name, title, body, ctaText, ctaUrl }
   */
  generic: (data) => ({
    subject: data.subject || "Message from DukaPlace",
    html: layout(`
      ${heading(data.title || "Hello!")}
      <p style="margin:8px 0 0;font-size:15px;color:${TEXT_MUTED};">Hi ${data.name || "there"},</p>
      ${divider()}
      <div style="font-size:15px;line-height:1.7;color:${TEXT_PRIMARY};">${data.body || ""}</div>
      ${data.ctaText && data.ctaUrl ? btn(data.ctaText, data.ctaUrl) : ""}
    `),
  }),
};

module.exports = templates;
