// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD,
//     },
// })


// const sendOtpMail = async (to, otp) => {
//     await transporter.sendMail({
//         from: process.env.EMAIL,
//         to,
//         subject: "Reset Your Password",
//         html: `<p>Your OTP for password reset is <b> ${otp} </b>. It will expire in 5 minutes.</p>`,
//     })
// }

// const sendDeliveryOtpMail = async (user, otp) => {
//     await transporter.sendMail({
//         from: process.env.EMAIL,
//         to: user.email,
//         subject: "Delivery OTP",
//         html: `<p>Your Delivery OTP is <b> ${otp} </b>. It will expire in 5 minutes.</p>`,
//     })
// }

// module.exports = { sendOtpMail, sendDeliveryOtpMail }


const Brevo = require("@getbrevo/brevo");

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY   // <- Add this in Render
);

// ================= Send Password Reset OTP =================
const sendOtpMail = async (to, otp) => {
    await apiInstance.sendTransacEmail({
        sender: { name: "BiteNow", email: process.env.SENDER_EMAIL }, // verified sender email
        to: [{ email: to }],
        subject: "Reset Your Password",
        htmlContent: `<p>Your OTP for Password Reset is <b>${otp}</b>. It will expire in 5 minutes.</p>`
    });
};

// ================= Send Delivery OTP =================
const sendDeliveryOtpMail = async (user, otp) => {
    await apiInstance.sendTransacEmail({
        sender: { name: "BiteNow", email: process.env.SENDER_EMAIL },
        to: [{ email: user.email }],
        subject: "Delivery OTP",
        htmlContent: `<p>Your BiteNow food delivery OTP is <strong style="font-size:18px;">${otp}</strong>. It will expire in 5 minutes.</p>`
    });
};

module.exports = { sendOtpMail, sendDeliveryOtpMail };
