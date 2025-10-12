const express = require('express');
const { signUp, signIn, signOut, sendOtp, verifyOtp, resetPassword, googleAuth } = require('../controllers/authControllers');
const authRouter = express.Router();


authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);
authRouter.get('/signout', signOut)

authRouter.post('/send-otp', sendOtp);
authRouter.post('/verify-otp', verifyOtp);
authRouter.post('/reset-passsword', resetPassword);
authRouter.post('/google-auth', googleAuth);



module.exports = authRouter;

