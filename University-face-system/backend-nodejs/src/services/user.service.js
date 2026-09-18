const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getAllUsers = async ({ page = 1, limit = 10, search = "" }) => {
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    let countQuery = "SELECT COUNT(*) as total FROM administrators";
    let dataQuery = `
        SELECT id, email, username, full_name, role, is_email_verified, last_login_at, created_at, updated_at 
        FROM administrators
    `;
    const queryParams = [];

    if (search) {
        const whereClause = " WHERE email LIKE ? OR full_name LIKE ? OR username LIKE ?";
        countQuery += whereClause;
        dataQuery += whereClause;
        queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    dataQuery += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    
    // We have to push limit and offset separately because they need to be numbers
    const dataParams = [...queryParams, Number(limit), Number(offset)];

    const [[countResult]] = await db.execute(countQuery, queryParams);
    const [users] = await db.execute(dataQuery, dataParams);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    return {
        data: users,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
        }
    };
};

const getUserById = async (id) => {
    const [users] = await db.execute(
        "SELECT id, email, username, full_name, role, is_email_verified, last_login_at, created_at, updated_at FROM administrators WHERE id = ?",
        [id]
    );

    if (users.length === 0) {
        throw new Error("Người dùng không tồn tại");
    }

    return users[0];
};

const createUser = async (userData) => {
    const { email, password, full_name, role, username } = userData;
    const emailLower = email.toLowerCase().trim();

    const [existingUsers] = await db.execute("SELECT id FROM administrators WHERE email = ?", [emailLower]);
    if (existingUsers.length > 0) {
        throw new Error("Email đã được đăng ký");
    }

    if (username) {
        const [existingUsernames] = await db.execute("SELECT id FROM administrators WHERE username = ?", [username]);
        if (existingUsernames.length > 0) {
            throw new Error("Username đã được sử dụng");
        }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
        `INSERT INTO administrators 
         (email, username, password, full_name, role, is_email_verified) 
         VALUES (?, ?, ?, ?, ?, 1)`, // Assuming admin creates verified users
        [emailLower, username || null, passwordHash, full_name || null, role || 'user']
    );

    return { id: result.insertId, email: emailLower, role: role || 'user' };
};

const updateUser = async (id, userData) => {
    const { email, full_name, role, username, password } = userData;
    
    // Check if user exists
    await getUserById(id);

    let updateFields = [];
    let queryParams = [];

    if (email) {
        const emailLower = email.toLowerCase().trim();
        const [existing] = await db.execute("SELECT id FROM administrators WHERE email = ? AND id != ?", [emailLower, id]);
        if (existing.length > 0) throw new Error("Email đã được đăng ký bởi người dùng khác");
        updateFields.push("email = ?");
        queryParams.push(emailLower);
    }

    if (username) {
        const [existing] = await db.execute("SELECT id FROM administrators WHERE username = ? AND id != ?", [username, id]);
        if (existing.length > 0) throw new Error("Username đã được đăng ký bởi người dùng khác");
        updateFields.push("username = ?");
        queryParams.push(username);
    }

    if (full_name !== undefined) {
        updateFields.push("full_name = ?");
        queryParams.push(full_name);
    }

    if (role) {
        updateFields.push("role = ?");
        queryParams.push(role);
    }

    if (password) {
        const passwordHash = await bcrypt.hash(password, 12);
        updateFields.push("password = ?");
        queryParams.push(passwordHash);
        // Force them to re-login by clearing tokens
        updateFields.push("refresh_token_hash = NULL");
    }

    if (updateFields.length === 0) {
        return { message: "Không có thông tin nào được cập nhật" };
    }

    const updateQuery = `UPDATE administrators SET ${updateFields.join(", ")} WHERE id = ?`;
    queryParams.push(id);

    await db.execute(updateQuery, queryParams);

    return { message: "Cập nhật thành công" };
};

const deleteUser = async (id) => {
    // Check if user exists
    await getUserById(id);

    await db.execute("DELETE FROM administrators WHERE id = ?", [id]);

    return { message: "Xóa người dùng thành công" };
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
