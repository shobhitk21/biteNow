const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const { genToken } = require('../utils/token.js');
const { sendOtpMail } = require('../utils/mail.js');

const signUp = async (req, res) => {
    try {

        const { fullName, email, password, role, mobile } = req.body;

        if (!fullName || !email || !mobile) {
            return res.status(401).json({ message: "missing credentials" });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "user already exists" });
        }

        if (mobile.length != 10) {
            return res.status(400).json({ message: "Mobile Number should be of 10 digit" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be of atleast 6 characters" });
        }

        const salt = await bcrypt.genSalt(10);
        const hassedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            fullName,
            email,
            password: hassedPassword,
            mobile,
            role
        })

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json({ user, message: "Signup Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }

}

const signIn = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: "missing credentials" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "no user found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "incorrect Password" })
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })

        return res.status(200).json({ user, message: "Signin Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }

}

const signOut = async (req, res) => {

    try {

        await res.clearCookie("token");
        return res.status(200).json({ message: "loggedOut Successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message })
    }


}

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "no user found" });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await user.save();
        await sendOtpMail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully!!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user || otp != user.resetOtp || Date.now() > user.otpExpires) {
            return res.status(400).json({ message: "invalid/expired OTP" });
        }
        user.isOtpVerified = true;
        user.otpExpires = undefined;
        user.resetOtp = undefined;
        await user.save();
        return res.status(200).json({ message: "OTP Verified!!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        const salt = await bcrypt.genSalt(10);
        const hassedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hassedPassword;
        user.isOtpVerified = false;
        await user.save();
        return res.status(200).json({ message: "Password Reset Successfully!!" });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }

}

const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile, role } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ fullName, email, mobile, role })
        }

        const token = genToken(User._id)
        res.cookie("token", token, {
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
        return res.status(200).json(user);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { signUp, signIn, signOut, sendOtp, verifyOtp, resetPassword, googleAuth };