const User = require("../models/userModel.js")

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(400).json({ message: "userId not found" })
        }

        let user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        console.error("getCurrentUser error:", error);
        return res.status(500).json({ message: error.message });
    }
}

const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        if (lat == null || lon == null) return res.status(400).json({ message: "Latitude and longitude are required" });
        if (!req.userId) return res.status(401).json({ message: "Unauthorized: Missing userId" });

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                $set: {
                    location: {
                        type: "Point",
                        coordinates: [Number(lon), Number(lat)]
                    }
                }
            },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: "user not found" });

        return res.status(200).json({
            message: "Location updated successfully",
            location: user.location,
        });
    } catch (error) {
        console.error("updateUserLocation error:", error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { getCurrentUser, updateUserLocation }