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
        console.log(error)
        return res.status(500).json(error.message)
    }
}

module.exports = { getCurrentUser }