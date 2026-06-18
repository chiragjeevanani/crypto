const nodemailer = require('nodemailer');

/**
 * Sends the ownership certificate email to the buyer.
 * @param {string} toEmail - Buyer's email address.
 * @param {Buffer} pdfBuffer - The generated PDF certificate buffer.
 * @param {string} title - The title of the NFT.
 */
const sendCertificateEmail = async (toEmail, pdfBuffer, title) => {
  try {
    // Check if SMTP details are configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn("SMTP credentials not configured in .env. Skipping certificate email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"KnQ Marketplace" <noreply@knq.com>',
      to: toEmail,
      subject: `Your Certificate of Digital OwnerShip for: ${title}`,
      text: `Congratulations on acquiring ${title}! Please find your official Certificate of Digital OwnerShip attached to this email.`,
      html: `
        <h3>Congratulations!</h3>
        <p>You are now the official owner of the digital collectible: <strong>${title}</strong>.</p>
        <p>Please find your official Certificate of Digital OwnerShip attached to this email as a PDF.</p>
        <br/>
        <p>Best regards,</p>
        <p>The KnQ Marketplace Team</p>
      `,
      attachments: [
        {
          filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Certificate email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending certificate email:", error);
  }
};

module.exports = { sendCertificateEmail };
