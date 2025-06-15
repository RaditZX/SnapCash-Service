const admin = require("./firebase-service");
const nodemailer = require("nodemailer");

// Konfigurasi transporter email
const transporter = nodemailer.createTransport({
  service: "Gmail", // Atau sesuaikan dengan provider Anda (SendGrid, Mailgun, dll)
  auth: {
    user: "snapcashdev@gmail.com",
    pass: "jflsvnhugiegmbyl", // Gunakan App Password (bukan password biasa)
  },
});

/**
 * Kirim email reset password ke pengguna
 * @param {string} email - Alamat email tujuan
 */
async function sendResetPasswordEmail(email) {
  try {
    // Generate reset link dari Firebase Admin SDK
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const mailOptions = {
      from: '"SnapCash Support" <your_email@gmail.com>',
      to: email,
      subject: "Reset Your SnapCash Password",
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password for your SnapCash account: <b>${email}</b>.</p>
        <p>You can reset your password by clicking the link below:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thanks,<br>The SnapCash Team</p>
      `,
    };

    // Kirim email
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset password email sent:", info.messageId);
    return { status: 200, message: "Reset password email sent successfully." };
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Failed to send reset email");
  }
}

module.exports={sendResetPasswordEmail};
