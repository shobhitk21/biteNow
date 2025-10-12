const express = require('express');
const itemRouter = express.Router()
const { isAuth } = require('../middlewares/isAuth');
const { addItem, editItem, getItemById, deleteItem } = require('../controllers/itemController');
const upload = require('../middlewares/multer');

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);
itemRouter.get("/get-by-id/:itemId", isAuth, getItemById);
itemRouter.get("/delete/:itemId", isAuth, deleteItem);



module.exports = itemRouter