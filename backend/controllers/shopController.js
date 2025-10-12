const uploadOnCloudinary = require("../config/cloudinary");
const Shop = require("../models/shopModel");


const createAndEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body
        let image;
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }

        let shop = await Shop.findOne({ owner: req.userId })
        if (!shop) {
            shop = await Shop.create({ name, city, state, address, image, owner: req.userId })
        } else {
            shop = await Shop.findByIdAndUpdate(shop._id, { name, city, state, address, image, owner: req.userId }, { new: true })
        }

        await shop.populate("owner")
        return res.status(201).json(shop)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId }).populate("owner").populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        })
        if (!shop) {
            return null
        }
        return res.status(200).json(shop)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}


module.exports = { createAndEditShop, getMyShop }