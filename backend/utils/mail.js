const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
})


const sendOtpMail = async (to, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: "Reset Your Password",
        html: `<p>Your OTP for password reset is <b> ${otp} </b>. It will expire in 5 minutes.</p>`,
    })
}

const sendDeliveryOtpMail = async (user, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: "Delivery OTP",
        html: `<p>Your Delivery OTP is <b> ${otp} </b>. It will expire in 5 minutes.</p>`,
    })
}

module.exports = { sendOtpMail, sendDeliveryOtpMail }