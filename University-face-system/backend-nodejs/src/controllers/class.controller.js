const pool = require('../config/db');

// --- CLASS SCHEDULES ---

exports.getAllClassSchedules = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT cs.*, c.course_code, c.course_name 
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id
        `;
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE cs.room_name LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY cs.start_time DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
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
        console.error('Error in getAllClassSchedules:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch học' });
    }
};

exports.getClassScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT cs.*, c.course_code, c.course_name 
            FROM class_schedules cs 
            LEFT JOIN courses c ON cs.course_id = c.id 
            WHERE cs.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getClassScheduleById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createClassSchedule = async (req, res) => {
    try {
        const { course_id, room_name, start_time, end_time } = req.body;
        
        if (!course_id || !room_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin lịch học' });
        }

        const [result] = await pool.query(
            'INSERT INTO class_schedules (course_id, room_name, start_time, end_time) VALUES (?, ?, ?, ?)',
            [course_id, room_name, start_time, end_time]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo lịch học thành công',
            data: { id: result.insertId, course_id, room_name, start_time, end_time }
        });
    } catch (error) {
        console.error('Error in createClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch học' });
    }
};

exports.updateClassSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, room_name, start_time, end_time } = req.body;

        if (!course_id || !room_name || !start_time || !end_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const [result] = await pool.query(
            'UPDATE class_schedules SET course_id = ?, room_name = ?, start_time = ?, end_time = ? WHERE id = ?',
            [course_id, room_name, start_time, end_time, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
        }

        res.json({ success: true, message: 'Cập nhật lịch học thành công' });
    } catch (error) {
        console.error('Error in updateClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch học' });
    }
};

exports.deleteClassSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check dependencies
        const [attendance] = await pool.query('SELECT id FROM class_attendance WHERE schedule_id = ? LIMIT 1', [id]);
        if (attendance.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch học vì đã có dữ liệu điểm danh' });
        }

        const [result] = await pool.query('DELETE FROM class_schedules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học để xóa' });
        }

        res.json({ success: true, message: 'Xóa lịch học thành công' });
    } catch (error) {
        console.error('Error in deleteClassSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa lịch học' });
    }
};

// --- CLASS ATTENDANCE ---

exports.getAllClassAttendance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const schedule_id = req.query.schedule_id; // Filter by schedule
        const offset = (page - 1) * limit;

        let query = `
            SELECT ca.*, s.student_code, s.full_name, s.class_name, 
                   cs.room_name, cs.start_time, c.course_code 
            FROM class_attendance ca
            JOIN students s ON ca.student_id = s.id
            JOIN class_schedules cs ON ca.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM class_attendance ca';
        const queryParams = [];
        const countParams = [];

        if (schedule_id) {
            query += ' WHERE ca.schedule_id = ?';
            countQuery += ' WHERE ca.schedule_id = ?';
            queryParams.push(schedule_id);
            countParams.push(schedule_id);
        }

        query += ' ORDER BY ca.check_in_time DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, countParams);
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
        console.error('Error in getAllClassAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.deleteClassAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM class_attendance WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu điểm danh' });
        }

        res.json({ success: true, message: 'Xóa dữ liệu điểm danh thành công' });
    } catch (error) {
        console.error('Error in deleteClassAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
