const jwt = require("jsonwebtoken");

const isAuth = async (req, res, next) => {
    try {
        const cookieToken = req.cookies?.token;

        const authorizationHeader = req.headers.authorization;

        const bearerToken = authorizationHeader?.startsWith("Bearer ")
            ? authorizationHeader.split(" ")[1]
            : null;

        const token = cookieToken || bearerToken;

        if (!token) {
            return res.status(401).json({
                message: "Authentication token not found",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                message: "Server authentication configuration is missing",
            });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decodedToken?.userId) {
            return res.status(401).json({
                message: "Invalid authentication token",
            });
        }

        req.userId = decodedToken.userId;

        return next();
    } catch (error) {
        console.error("Authentication error:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Your session has expired. Please sign in again.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid authentication token",
            });
        }

        return res.status(500).json({
            message: "Unable to authenticate request",
        });
    }
};

module.exports = {
    isAuth,
};