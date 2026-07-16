const uploadOnCloudinary = require("../config/cloudinary.js");
const Shop = require("../models/shopModel");


const createAndEditShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body
        let image;

        if (req.file) {
            image = await uploadOnCloudinary(req.file.buffer)
        }

        let shop = await Shop.findOne({ owner: req.userId })

        if (!shop) {
            shop = await Shop.create({ name, city, state, address, image, owner: req.userId })
        } else {
            shop = await Shop.findByIdAndUpdate(shop._id, { name, city, state, address, image, owner: req.userId }, { new: true })
            console.log(shop);
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

const getShopByCity = async (req, res) => {
    try {
        const { city } = req.params
        const shops = await Shop.find({ city: { $regex: new RegExp(`^${city}$`, "i") } }).populate("items")
        if (!shops) {
            return res.status(400).json({ message: "No shop found in your area" })
        }
        return res.status(200).json(shops)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

export const getAllShops = async (req, res) => {
    try {
      const shops = await Shop.find({})
        .sort({ createdAt: -1 })
        .lean();
  
      return res.status(200).json({
        success: true,
        shops,
      });
    } catch (error) {
      console.error("Get all shops error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Unable to get shops.",
      });
    }
  };

module.exports = { createAndEditShop, getMyShop, getShopByCity }