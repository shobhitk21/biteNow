const express = require('express');
const shopRouter = express.Router()
const { isAuth } = require('../middlewares/isAuth');
const { createAndEditShop, getMyShop } = require('../controllers/shopController');
const upload = require('../middlewares/multer');

shopRouter.post("/create-edit", isAuth, upload.single("image"), createAndEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);


module.exports = shopRouter