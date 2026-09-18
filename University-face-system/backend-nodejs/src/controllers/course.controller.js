const pool = require('../config/db');

exports.getAllCourses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM courses';
        let countQuery = 'SELECT COUNT(*) as total FROM courses';
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE course_code LIKE ? OR course_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`] : []);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllCourses:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách môn học' });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getCourseById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { course_code, course_name } = req.body;
        if (!course_code || !course_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mã môn và tên môn học' });
        }

        const [result] = await pool.query(
            'INSERT INTO courses (course_code, course_name) VALUES (?, ?)',
            [course_code, course_name]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo môn học thành công',
            data: { id: result.insertId, course_code, course_name }
        });
    } catch (error) {
        console.error('Error in createCourse:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo môn học' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mã môn và tên môn học' });
        }

        const [result] = await pool.query(
            'UPDATE courses SET course_code = ?, course_name = ? WHERE id = ?',
            [course_code, course_name, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy môn học để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật môn học thành công' });
    } catch (error) {
        console.error('Error in updateCourse:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật môn học' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deletion if there are dependencies (e.g. class_schedules)
        const [schedules] = await pool.query('SELECT id FROM class_schedules WHERE course_id = ? LIMIT 1', [id]);
        if (schedules.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa môn học này vì đã có lịch học liên quan' });
        }

        const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy môn học để xóa' });
        }

        res.json({ success: true, message: 'Xóa môn học thành công' });
    } catch (error) {
        console.error('Error in deleteCourse:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa môn học' });
    }
};
