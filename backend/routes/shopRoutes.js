const express = require('express');
const shopRouter = express.Router()
const { isAuth } = require('../middlewares/isAuth');
const { createAndEditShop, getMyShop, getShopByCity } = require('../controllers/shopController');
const upload = require('../middlewares/multer');

shopRouter.post("/create-edit", isAuth, upload.single("image"), createAndEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);
shopRouter.get("/get-by-city/:city", isAuth, getShopByCity);


module.exports = shopRouter