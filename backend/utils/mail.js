
const Brevo = require("@getbrevo/brevo");

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY   
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
