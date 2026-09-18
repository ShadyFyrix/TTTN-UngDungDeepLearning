const userService = require("../services/user.service");

const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const result = await userService.getAllUsers({ page, limit, search });
        res.status(200).json({
            success: true,
            message: "Lấy danh sách người dùng thành công",
            ...result, // includes data and pagination
        });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json({
            success: true,
            message: "Lấy chi tiết người dùng thành công",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const result = await userService.createUser(req.body);
        res.status(201).json({
            success: true,
            message: "Tạo người dùng mới thành công",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const result = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
