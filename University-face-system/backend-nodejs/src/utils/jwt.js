const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user.id.toString(),
            role: user.role,
            type: "access",
        },
        process.env.JWT_ACCESS_SECRET || "default_access_secret",
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            sub: user.id.toString(),
            type: "refresh",
        },
        process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET || "default_access_secret");
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
