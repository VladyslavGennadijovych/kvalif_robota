import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Універсальна функція для відправки листа
const sendMail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"JobHunting" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

const sendVerificationEmail = async (to, token) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;
  await sendMail({
    to,
    subject: 'Підтвердження електронної пошти',
    html: `<p>Будь ласка, перейдіть за <a href="${verificationLink}">цим посиланням</a>, щоб підтвердити вашу електронну пошту.</p>`
  });
};

export { sendMail, sendVerificationEmail };
