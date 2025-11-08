const express = require('express');
const userRouter = express.Router()
const { getCurrentUser, updateUserLocation } = require('../controllers/userController.js');
const { isAuth } = require('../middlewares/isAuth');

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update-location", isAuth, updateUserLocation);


module.exports = userRouter