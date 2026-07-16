const express = require("express");
const itemRouter = express.Router();

const { isAuth } = require("../middlewares/isAuth.js");
const upload = require("../middlewares/multer.js");
const { addItem, editItem, getItemById, deleteItem, getItemsByShop, searchItems, rating, getUserRating, getAllItems, } = require("../controllers/itemController.js");
itemRouter.get("/all", getAllItems);
itemRouter.get("/search-items", searchItems);
itemRouter.get("/get-by-shop/:shopId", getItemsByShop);
itemRouter.get("/get-by-id/:itemId", getItemById);
itemRouter.post("/rating", isAuth, rating);
itemRouter.get("/:itemId/rating", isAuth, getUserRating);
itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/delete/:itemId", isAuth, deleteItem);

module.exports = itemRouter;