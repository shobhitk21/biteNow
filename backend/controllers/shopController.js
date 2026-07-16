const uploadOnCloudinary = require("../config/cloudinary.js");
const Shop = require("../models/shopModel.js");

const createAndEditShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;

    let image;

    if (req.file) {
      image = await uploadOnCloudinary(req.file.buffer);
    }

    let shop = await Shop.findOne({
      owner: req.userId,
    });

    if (!shop) {
      shop = await Shop.create({
        name,
        city,
        state,
        address,
        image,
        owner: req.userId,
      });
    } else {
      const updateData = {
        name,
        city,
        state,
        address,
        owner: req.userId,
      };

      // Do not overwrite the previous image when no new image is uploaded
      if (image) {
        updateData.image = image;
      }

      shop = await Shop.findByIdAndUpdate(
        shop._id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    await shop.populate("owner");

    return res.status(201).json(shop);
  } catch (error) {
    console.error("Create or edit shop error:", error);

    return res.status(500).json({
      message: error.message || "Unable to create or update shop",
    });
  }
};

const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({
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

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error("Get my shop error:", error);

    return res.status(500).json({
      message: error.message || "Unable to get shop",
    });
  }
};

const getShopByCity = async (req, res) => {
  try {
    const { city } = req.params;

    const shops = await Shop.find({
      city: {
        $regex: new RegExp(`^${city}$`, "i"),
      },
    }).populate("items");

    // Shop.find() always returns an array, so check its length
    if (shops.length === 0) {
      return res.status(404).json({
        message: "No shop found in your area",
      });
    }

    return res.status(200).json(shops);
  } catch (error) {
    console.error("Get shops by city error:", error);

    return res.status(500).json({
      message: error.message || "Unable to get shops",
    });
  }
};

const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({})
      .populate("owner")
      .populate("items")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      shops,
    });
  } catch (error) {
    console.error("Get all shops error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to get all shops",
    });
  }
};

module.exports = {
  createAndEditShop,
  getMyShop,
  getShopByCity,
  getAllShops,
};