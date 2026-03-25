const prisma = require("../lib/prisma");

/**
 * Queue an email for sending.
 * @param {Object} options
 * @param {string}   options.to            - Recipient email
 * @param {string}   [options.toName]      - Recipient name
 * @param {string}   options.template      - Template key: welcome | otp | passwordChanged | generic
 * @param {Object}   [options.templateData]- Data passed to template
 * @param {Array}    [options.attachments] - [{ filename, path }] or [{ filename, content, encoding, contentType }]
 * @param {Date}     [options.scheduledAt] - When to send (default: now)
 * @param {number}   [options.maxAttempts] - Max retries (default: 3)
 */
const queueEmail = async ({
  to,
  toName       = null,
  template,
  templateData = {},
  attachments  = [],
  scheduledAt  = new Date(),
  maxAttempts  = 3,
}) => {
  if (!to || !template) throw new Error("queueEmail: 'to' and 'template' are required");

  await prisma.emailQueue.create({
    data: {
      toEmail:      to,
      toName,
      subject:      templateData.subject || template,
      template,
      templateData,
      attachments,
      scheduledAt,
      maxAttempts,
    },
  });
};

module.exports = { queueEmail };
