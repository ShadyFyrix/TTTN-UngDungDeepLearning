const crypto = require("crypto");

const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
    generateRandomToken,
    generateOTP,
    hashToken,
};
