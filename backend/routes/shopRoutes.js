const express = require("express");
const shopRouter = express.Router();
const { isAuth } = require("../middlewares/isAuth");
const upload = require("../middlewares/multer");
const {  createAndEditShop,  getMyShop,  getShopByCity,  getAllShops,} = require("../controllers/shopController");


shopRouter.get("/all", getAllShops);
shopRouter.post(  "/create-edit",  isAuth,  upload.single("image"),createAndEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);
shopRouter.get(  "/get-by-city/:city",  isAuth,  getShopByCity);

module.exports = shopRouter;