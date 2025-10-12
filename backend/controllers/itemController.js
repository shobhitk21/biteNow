const uploadOnCloudinary = require("../config/cloudinary");
const Item = require("../models/itemModels");
const Shop = require("../models/shopModel");

const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }
        const shop = await Shop.findOne({ owner: req.userId })
        if (!shop) {
            return res.status(400).json({ message: "shop not found" });
        }

        const item = await Item.create({ name, category, foodType, price, image, shop: shop._id })
        shop.items.push(item._id)
        await shop.save()
        await shop.populate("items owner")

        return res.status(200).json(shop)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const { name, category, foodType, price } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }

        const item = await Item.findByIdAndUpdate(itemId, { name, category, foodType, price, image }, { new: true })
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }
        return res.status(200).json(item)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}

module.exports = { addItem, editItem }