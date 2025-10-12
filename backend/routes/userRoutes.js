const express = require('express');
const userRouter = express.Router()
const { getCurrentUser } = require('../controllers/userController.js');
const { isAuth } = require('../middlewares/isAuth');

userRouter.get("/current", isAuth, getCurrentUser);

module.exports = userRouter