const jwt = require("jsonwebtoken");

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(400).json({ message: "token not found" });
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodeToken) {
            return res.status(400).json({ message: "token not verified" });
        }
        req.userId = decodeToken.userId
        next();

    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message);
    }

}

module.exports = { isAuth }