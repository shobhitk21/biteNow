const uploadOnCloudinary = require("../config/cloudinary.js");
const Item = require("../models/itemModels.js");
const Shop = require("../models/shopModel.js");

/**
 * Add a new food item to the logged-in owner's shop.
 */
const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price } = req.body;

        if (!name || !category || !foodType || price === undefined) {
            return res.status(400).json({
                message: "Name, category, food type and price are required",
            });
        }

        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                message: "Price must be a valid positive number",
            });
        }

        let image;

        if (req.file) {
            image = await uploadOnCloudinary(req.file.buffer);
        }

        const shop = await Shop.findOne({
            owner: req.userId,
        });

        if (!shop) {
            return res.status(404).json({
                message: "Shop not found",
            });
        }

        const item = await Item.create({
            name: name.trim(),
            category: category.trim(),
            foodType: foodType.trim(),
            price: numericPrice,
            image,
            shop: shop._id,
        });

        shop.items.push(item._id);
        await shop.save();

        await shop.populate("owner");

        await shop.populate({
            path: "items",
            options: {
                sort: {
                    updatedAt: -1,
                },
            },
        });

        return res.status(201).json(shop);
    } catch (error) {
        console.error("Add item error:", error);

        return res.status(500).json({
            message: error.message || "Unable to add item",
        });
    }
};

/**
 * Edit an existing item.
 */
const editItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, category, foodType, price } = req.body;

        if (!itemId) {
            return res.status(400).json({
                message: "Item ID is required",
            });
        }

        const existingItem = await Item.findById(itemId);

        if (!existingItem) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        const shop = await Shop.findOne({
            owner: req.userId,
        });

        if (!shop) {
            return res.status(404).json({
                message: "Shop not found",
            });
        }

        if (
            existingItem.shop &&
            existingItem.shop.toString() !== shop._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not allowed to edit this item",
            });
        }

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (category !== undefined) {
            updateData.category = category.trim();
        }

        if (foodType !== undefined) {
            updateData.foodType = foodType.trim();
        }

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (Number.isNaN(numericPrice) || numericPrice < 0) {
                return res.status(400).json({
                    message: "Price must be a valid positive number",
                });
            }

            updateData.price = numericPrice;
        }

        /*
         Only update the image when a new image is uploaded.
         This prevents the existing image from becoming undefined.
        */
        if (req.file) {
            updateData.image = await uploadOnCloudinary(
                req.file.buffer
            );
        }

        await Item.findByIdAndUpdate(itemId, updateData, {
            new: true,
            runValidators: true,
        });

        const updatedShop = await Shop.findOne({
            owner: req.userId,
        })
            .populate("owner")
            .populate({
                path: "items",
                options: {
                    sort: {
                        updatedAt: -1,
                    },
                },
            });

        return res.status(200).json(updatedShop);
    } catch (error) {
        console.error("Edit item error:", error);

        return res.status(500).json({
            message: error.message || "Unable to edit item",
        });
    }
};

/**
 * Get one food item by its ID.
 */
const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await Item.findById(itemId).populate(
            "shop",
            "name image city state address"
        );

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        return res.status(200).json(item);
    } catch (error) {
        console.error("Get item by ID error:", error);

        return res.status(500).json({
            message: error.message || "Unable to get item",
        });
    }
};

/**
 * Delete an item belonging to the logged-in owner's shop.
 */
const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const shop = await Shop.findOne({
            owner: req.userId,
        });

        if (!shop) {
            return res.status(404).json({
                message: "Shop not found",
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        if (
            item.shop &&
            item.shop.toString() !== shop._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not allowed to delete this item",
            });
        }

        await Item.findByIdAndDelete(itemId);

        shop.items = shop.items.filter(
            (currentItemId) =>
                currentItemId.toString() !== itemId.toString()
        );

        await shop.save();

        await shop.populate("owner");

        await shop.populate({
            path: "items",
            options: {
                sort: {
                    updatedAt: -1,
                },
            },
        });

        return res.status(200).json(shop);
    } catch (error) {
        console.error("Delete item error:", error);

        return res.status(500).json({
            message: error.message || "Unable to delete item",
        });
    }
};

/**
 * Get every food item from every shop.
 *
 * This endpoint has no connection with the user's location.
 * Frontend endpoint:
 * GET /api/item/all
 */
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find({})
            .populate(
                "shop",
                "name image city state address"
            )
            .sort({
                createdAt: -1,
            })
            .lean();

        return res.status(200).json({
            success: true,
            items,
        });
    } catch (error) {
        console.error("Get all items error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message || "Unable to get food items",
        });
    }
};

/**
 * Old city-based endpoint.
 *
 * You can keep this for compatibility, but UserDashboard should use
 * getAllItems instead.
 */
const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({
                message: "City is required",
            });
        }

        const escapedCity = city.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const shops = await Shop.find({
            city: {
                $regex: new RegExp(`^${escapedCity}$`, "i"),
            },
        });

        if (shops.length === 0) {
            return res.status(200).json([]);
        }

        const shopIds = shops.map((shop) => shop._id);

        const items = await Item.find({
            shop: {
                $in: shopIds,
            },
        })
            .populate(
                "shop",
                "name image city state address"
            )
            .sort({
                createdAt: -1,
            });

        return res.status(200).json(items);
    } catch (error) {
        console.error("Get items by city error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to get items by city",
        });
    }
};

/**
 * Get all items belonging to one shop.
 */
const getItemsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;

        const shop = await Shop.findById(shopId)
            .populate("owner", "fullName name email")
            .populate({
                path: "items",
                options: {
                    sort: {
                        createdAt: -1,
                    },
                },
            });

        if (!shop) {
            return res.status(404).json({
                message: "Shop not found",
            });
        }

        return res.status(200).json({
            shop,
            items: Array.isArray(shop.items)
                ? shop.items
                : [],
        });
    } catch (error) {
        console.error("Get items by shop error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to get shop items",
        });
    }
};

/**
 * Search every food item from every shop.
 *
 * Location/city is no longer required.
 * Request example:
 * GET /api/item/search?query=pizza
 */
const searchItems = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                message: "Search query is required",
            });
        }

        const escapedQuery = query
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const items = await Item.find({
            $or: [
                {
                    name: {
                        $regex: escapedQuery,
                        $options: "i",
                    },
                },
                {
                    category: {
                        $regex: escapedQuery,
                        $options: "i",
                    },
                },
                {
                    foodType: {
                        $regex: escapedQuery,
                        $options: "i",
                    },
                },
            ],
        })
            .populate(
                "shop",
                "name image city state address"
            )
            .limit(40)
            .sort({
                createdAt: -1,
            });

        return res.status(200).json(items);
    } catch (error) {
        console.error("Search items error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to search food items",
        });
    }
};

/**
 * Add or update the logged-in user's rating.
 */
const rating = async (req, res) => {
    try {
        const { itemId, rating: ratingValue } = req.body;
        const userId = req.userId;

        if (!itemId || ratingValue === undefined) {
            return res.status(400).json({
                message: "Item ID and rating are required",
            });
        }

        const numericRating = Number(ratingValue);

        if (
            Number.isNaN(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message:
                    "Rating must be a number between 1 and 5",
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        if (!item.rating) {
            item.rating = {
                average: 0,
                count: 0,
                ratings: [],
            };
        }

        if (!Array.isArray(item.rating.ratings)) {
            item.rating.ratings = [];
        }

        const existingRating = item.rating.ratings.find(
            (currentRating) =>
                currentRating?.user?.toString() ===
                userId.toString()
        );

        if (existingRating) {
            existingRating.value = numericRating;
        } else {
            item.rating.ratings.push({
                user: userId,
                value: numericRating,
            });
        }

        const validRatings = item.rating.ratings
            .map((currentRating) =>
                Number(currentRating.value)
            )
            .filter(
                (value) =>
                    !Number.isNaN(value) && value > 0
            );

        const count = validRatings.length;

        const average =
            count === 0
                ? 0
                : validRatings.reduce(
                    (total, value) => total + value,
                    0
                ) / count;

        item.rating.count = count;
        item.rating.average = Number(
            average.toFixed(1)
        );

        await item.save();

        return res.status(200).json({
            rating: item.rating,
        });
    } catch (error) {
        console.error("Rating error:", error);

        return res.status(500).json({
            message: error.message || "Unable to rate item",
        });
    }
};

/**
 * Get the logged-in user's existing rating for an item.
 */
const getUserRating = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.userId;

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        const ratings = Array.isArray(
            item.rating?.ratings
        )
            ? item.rating.ratings
            : [];

        const userRating = ratings.find(
            (currentRating) =>
                currentRating?.user?.toString() ===
                userId.toString()
        );

        return res.status(200).json({
            rating: userRating
                ? userRating.value
                : 0,
        });
    } catch (error) {
        console.error("Get user rating error:", error);

        return res.status(500).json({
            message:
                error.message || "Unable to get user rating",
        });
    }
};

module.exports = {
    addItem,
    editItem,
    getItemById,
    deleteItem,
    getAllItems,
    getItemByCity,
    getItemsByShop,
    searchItems,
    rating,
    getUserRating,
};