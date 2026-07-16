require("dotenv").config();

const Brevo = require("@getbrevo/brevo");

const getBrevoClient = () => {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error("BREVO_API_KEY is missing from the backend .env file");
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey
    );

    return apiInstance;
};

const getSender = () => {
    const senderEmail = process.env.SENDER_EMAIL;
    const senderName = process.env.SENDER_NAME || "BiteNow";

    if (!senderEmail) {
        throw new Error("SENDER_EMAIL is missing from the backend .env file");
    }

    return {
        name: senderName,
        email: senderEmail,
    };
};

const validateEmail = (email) => {
    if (!email || typeof email !== "string") {
        throw new Error("Receiver email address is missing");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        throw new Error(`Invalid receiver email address: ${normalizedEmail}`);
    }

    return normalizedEmail;
};

const validateOtp = (otp) => {
    const normalizedOtp = String(otp || "").trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
        throw new Error("OTP must contain exactly 6 digits");
    }

    return normalizedOtp;
};

const sendTransactionalEmail = async ({
    to,
    subject,
    htmlContent,
    textContent,
}) => {
    const receiverEmail = validateEmail(to);
    const apiInstance = getBrevoClient();
    const sender = getSender();

    try {
        const emailData = new Brevo.SendSmtpEmail();

        emailData.sender = sender;

        emailData.to = [
            {
                email: receiverEmail,
            },
        ];

        emailData.subject = subject;
        emailData.htmlContent = htmlContent;
        emailData.textContent = textContent;

        const response = await apiInstance.sendTransacEmail(
            emailData
        );

        console.log("Brevo email sent successfully:", {
            to: receiverEmail,
            subject,
            messageId:
                response?.messageId ||
                response?.body?.messageId ||
                null,
        });

        return response;
    } catch (error) {
        const brevoMessage =
            error?.response?.body?.message ||
            error?.response?.data?.message ||
            error?.body?.message ||
            error?.message ||
            "Unknown Brevo email error";

        console.error("Brevo email sending failed:", {
            to: receiverEmail,
            subject,
            message: brevoMessage,
            status:
                error?.response?.statusCode ||
                error?.response?.status ||
                error?.statusCode ||
                null,
            body:
                error?.response?.body ||
                error?.response?.data ||
                error?.body ||
                null,
        });

        throw new Error(`Brevo email failed: ${brevoMessage}`);
    }
};

// ================= Password Reset OTP =================

const sendOtpMail = async (to, otp) => {
    const normalizedOtp = validateOtp(otp);

    return sendTransactionalEmail({
        to,
        subject: "Reset Your BiteNow Password",

        textContent: `
Your BiteNow password reset OTP is ${normalizedOtp}.

This OTP will expire in 5 minutes.

Do not share this OTP with anyone.
    `.trim(),

        htmlContent: `
      <div
        style="
          max-width: 520px;
          margin: 20px auto;
          padding: 24px;
          border: 1px solid #eeeeee;
          border-radius: 12px;
          font-family: Arial, sans-serif;
          color: #222222;
        "
      >
        <h1 style="color: #ff4d2d; margin: 0 0 10px;">
          BiteNow
        </h1>

        <h2 style="margin-bottom: 16px;">
          Reset your password
        </h2>

        <p>
          Use the OTP below to reset your BiteNow password:
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            background-color: #fff3ef;
            border-radius: 10px;
            text-align: center;
          "
        >
          <strong
            style="
              color: #ff4d2d;
              font-size: 32px;
              letter-spacing: 7px;
            "
          >
            ${normalizedOtp}
          </strong>
        </div>

        <p>
          This OTP will expire in
          <strong>5 minutes</strong>.
        </p>

        <p style="color: #666666;">
          Do not share this OTP with anyone.
        </p>
      </div>
    `,
    });
};

// ================= Delivery OTP =================

const sendDeliveryOtpMail = async (user, otp) => {
    const customerEmail =
        typeof user === "string" ? user : user?.email;

    const customerName =
        typeof user === "object" && user?.fullName
            ? user.fullName
            : "Customer";

    const normalizedOtp = validateOtp(otp);

    return sendTransactionalEmail({
        to: customerEmail,
        subject: "Your BiteNow Delivery OTP",

        textContent: `
Hello ${customerName},

Your BiteNow delivery OTP is ${normalizedOtp}.

This OTP will expire in 5 minutes.

Share this OTP with the delivery partner only after receiving your order.
    `.trim(),

        htmlContent: `
      <div
        style="
          max-width: 520px;
          margin: 20px auto;
          padding: 24px;
          border: 1px solid #eeeeee;
          border-radius: 12px;
          font-family: Arial, sans-serif;
          color: #222222;
        "
      >
        <h1 style="color: #ff4d2d; margin: 0 0 10px;">
          BiteNow
        </h1>

        <h2 style="margin-bottom: 16px;">
          Delivery confirmation
        </h2>

        <p>Hello ${customerName},</p>

        <p>
          Your food delivery confirmation OTP is:
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            background-color: #fff3ef;
            border-radius: 10px;
            text-align: center;
          "
        >
          <strong
            style="
              color: #ff4d2d;
              font-size: 32px;
              letter-spacing: 7px;
            "
          >
            ${normalizedOtp}
          </strong>
        </div>

        <p>
          This OTP will expire in
          <strong>5 minutes</strong>.
        </p>

        <p style="color: #666666;">
          Share this OTP with the delivery partner only
          after receiving your order.
        </p>
      </div>
    `,
    });
};

module.exports = {
    sendOtpMail,
    sendDeliveryOtpMail,
};