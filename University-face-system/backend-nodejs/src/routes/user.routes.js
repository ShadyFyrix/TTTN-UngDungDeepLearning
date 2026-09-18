const express = require("express");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ---------------------------------------------------------
// User routes (Accessible by any logged-in user)
// ---------------------------------------------------------
router.get("/me", authMiddleware, authController.getMe);

// ---------------------------------------------------------
// Admin CRUD routes (Accessible ONLY by admin)
// ---------------------------------------------------------
// Middleware stack: must be authenticated AND have role 'admin'
const adminOnly = [authMiddleware, roleMiddleware('admin')];

router.get("/", adminOnly, userController.getAllUsers);
router.get("/:id", adminOnly, userController.getUserById);
router.post("/", adminOnly, userController.createUser);
router.put("/:id", adminOnly, userController.updateUser);
router.delete("/:id", adminOnly, userController.deleteUser);

module.exports = router;
