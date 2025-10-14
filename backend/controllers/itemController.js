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
        await shop.populate("owner")
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })

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
        const shop = await Shop.findOne({ owner: req.userId }).populate("owner").populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })

        return res.status(200).json(shop)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}

const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findById(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        return res.status(200).json(item)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const item = await Item.findByIdAndDelete(itemId)
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }
        const shop = await Shop.findOne({ owner: req.userId })
        shop.items = shop.items.filter(i => i !== item._id)
        await shop.save()
        await shop.populate("owner")
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })

        return res.status(200).json(shop)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params
        if (!city) {
            return res.status(400).json({ message: "City is required" })
        }
        const shops = await Shop.find({ city: { $regex: new RegExp(`^${city}$`, "i") } }).populate("items")
        if (!shops) {
            return res.status(400).json({ message: "No shop found in your area" })
        }
        const shopIDs = shops.map(shop => shop._id)
        const items = await Item.find({ shop: { $in: shopIDs } }).populate("shop")
        return res.status(200).json(items)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}

module.exports = { addItem, editItem, getItemById, deleteItem, getItemByCity }