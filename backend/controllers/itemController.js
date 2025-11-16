const uploadOnCloudinary = require("../config/cloudinary");
const { create } = require("../models/deliveryAssignmentModel");
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

const getItemsByShop = async (req, res) => {
    try {
        const { shopId } = req.params
        const shop = await Shop.findById(shopId).populate("items")
        if (!shop) {
            return res.status(400).json({ message: "No shop found" })
        }
        return res.status(200).json({ shop, items: shop.items })


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}

const searchItems = async (req, res) => {
    try {
        const { query, city } = req.query;
        if (!query || !city) {
            return res.status(400).json({ message: "Missing query or city" })
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") }
        }).populate("items");

        if (!shops || shops.length === 0) {
            return res.status(400).json({ message: "No shop found in your area" })
        }

        const shopIds = shops.map(s => s._id);

        const items = await Item.find({
            shop: { $in: shopIds },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } }
            ]
        }).populate("shop", "name image")
            .limit(40)
            .sort({ createdAt: -1 })

        return res.status(200).json(items)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const rating = async (req, res) => {
    try {
        const { itemId, rating } = req.body;
        const userId = req.userId; // from auth middleware

        if (!itemId || rating == null) {
            return res.status(400).json({ message: "itemId and rating are required" });
        }

        const numericRating = Number(rating);

        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "rating must be a number between 1 and 5" });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Initialize rating object
        if (!item.rating) {
            item.rating = { average: 0, count: 0, ratings: [] };
        }

        // Check if user already rated
        const existingRating = item.rating.ratings.find(
            r => r.user.toString() === userId
        );

        if (existingRating) {
            existingRating.value = numericRating;
        } else {
            item.rating.ratings.push({ user: userId, value: numericRating });
        }

        // AVERAGE
        const validRatings = item.rating.ratings
            .map(r => Number(r.value))
            .filter(v => !isNaN(v) && v > 0);

        const count = validRatings.length;
        const avg = count === 0
            ? 0
            : validRatings.reduce((a, b) => a + b, 0) / count;

        item.rating.count = count;
        item.rating.average = Number(avg.toFixed(1));    // round to 1 decimal
        // ----------------------------------------------

        await item.save();

        res.status(200).json({ rating: item.rating });

    } catch (error) {
        console.error("rating error:", error);
        res.status(500).json({ message: error.message });
    }
}

const getUserRating = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.userId;

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        const userRating = item.rating.ratings.find(
            (r) => r.user.toString() === userId
        );

        return res.status(200).json({ rating: userRating ? userRating.value : 0 });
    } catch (error) {
        console.error("getUserRating error:", error);
        return res.status(500).json({ message: error.message });
    }
}


module.exports = { addItem, editItem, getItemById, deleteItem, getItemByCity, getItemsByShop, searchItems, rating, getUserRating }