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

const sendOtpEmail = async (toEmail, otp) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn("SMTP credentials not configured in .env. Skipping OTP email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"KNQ Marketplace" <noreply@knq.com>',
      to: toEmail,
      subject: `Your Password Reset OTP - KNQ Marketplace`,
      text: `Your OTP for resetting your password is ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #f59e0b; text-align: center;">KNQ Marketplace</h2>
          <h3 style="text-align: center; color: #333;">Password Reset Request</h3>
          <p style="color: #555; line-height: 1.5;">You recently requested to reset your password for your KNQ Marketplace account. Use the OTP below to complete the process.</p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 25px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
          </div>
          
          <p style="color: #555; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
          <br/>
          <p style="color: #777; font-size: 12px; text-align: center;">Best regards,<br/>The KNQ Marketplace Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

const sendVerificationEmail = async (toEmail, otp) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn("SMTP credentials not configured in .env. Skipping verification email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"KNQ Marketplace" <noreply@knq.com>',
      to: toEmail,
      subject: `Verify your email address - KNQ Marketplace`,
      text: `Welcome to KNQ Marketplace! Your email verification OTP is ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #f59e0b; text-align: center;">KNQ Marketplace</h2>
          <h3 style="text-align: center; color: #333;">Welcome aboard!</h3>
          <p style="color: #555; line-height: 1.5;">Thank you for registering. To complete your sign-up and secure your account, please verify your email address using the OTP below.</p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 25px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
          </div>
          
          <p style="color: #555; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <br/>
          <p style="color: #777; font-size: 12px; text-align: center;">Best regards,<br/>The KNQ Marketplace Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

module.exports = { sendCertificateEmail, sendOtpEmail, sendVerificationEmail };
