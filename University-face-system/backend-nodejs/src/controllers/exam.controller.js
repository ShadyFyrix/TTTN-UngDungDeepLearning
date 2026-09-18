const pool = require('../config/db');

// --- EXAM SCHEDULES ---

exports.getAllExamSchedules = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = `
            SELECT es.*, c.course_code, c.course_name 
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id
        `;
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE es.exam_room LIKE ? OR c.course_code LIKE ? OR c.course_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY es.exam_time DESC LIMIT ? OFFSET ?';
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
        console.error('Error in getAllExamSchedules:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch thi' });
    }
};

exports.getExamScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT es.*, c.course_code, c.course_name 
            FROM exam_schedules es 
            LEFT JOIN courses c ON es.course_id = c.id 
            WHERE es.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getExamScheduleById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createExamSchedule = async (req, res) => {
    try {
        const { course_id, exam_room, exam_time, seating_rows, seating_cols, disabled_seats } = req.body;
        
        if (!course_id || !exam_room || !exam_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền thông tin bắt buộc: Môn thi, Phòng thi, Giờ thi' });
        }

        const [result] = await pool.query(
            'INSERT INTO exam_schedules (course_id, exam_room, exam_time, seating_rows, seating_cols, disabled_seats) VALUES (?, ?, ?, ?, ?, ?)',
            [course_id, exam_room, exam_time, seating_rows || 0, seating_cols || 0, disabled_seats || '']
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo lịch thi thành công',
            data: { id: result.insertId, course_id, exam_room, exam_time }
        });
    } catch (error) {
        console.error('Error in createExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo lịch thi' });
    }
};

exports.updateExamSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, exam_room, exam_time, seating_rows, seating_cols, disabled_seats } = req.body;

        if (!course_id || !exam_room || !exam_time) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền thông tin bắt buộc' });
        }

        const [result] = await pool.query(
            'UPDATE exam_schedules SET course_id = ?, exam_room = ?, exam_time = ?, seating_rows = ?, seating_cols = ?, disabled_seats = ? WHERE id = ?',
            [course_id, exam_room, exam_time, seating_rows || 0, seating_cols || 0, disabled_seats || '', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi' });
        }

        res.json({ success: true, message: 'Cập nhật lịch thi thành công' });
    } catch (error) {
        console.error('Error in updateExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật lịch thi' });
    }
};

exports.deleteExamSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check dependencies
        const [eligibility] = await pool.query('SELECT id FROM exam_eligibility WHERE exam_schedule_id = ? LIMIT 1', [id]);
        if (eligibility.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch thi vì đã có danh sách sinh viên dự thi' });
        }
        
        const [attendance] = await pool.query('SELECT id FROM exam_attendance WHERE exam_schedule_id = ? LIMIT 1', [id]);
        if (attendance.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa lịch thi vì đã có dữ liệu điểm danh thi' });
        }

        const [result] = await pool.query('DELETE FROM exam_schedules WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch thi để xóa' });
        }

        res.json({ success: true, message: 'Xóa lịch thi thành công' });
    } catch (error) {
        console.error('Error in deleteExamSchedule:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa lịch thi' });
    }
};

// --- EXAM ELIGIBILITY ---

exports.getExamEligibility = async (req, res) => {
    try {
        const schedule_id = req.query.schedule_id;
        
        if (!schedule_id) {
            return res.status(400).json({ success: false, message: 'Thiếu schedule_id' });
        }

        const query = `
            SELECT ee.*, s.student_code, s.full_name, s.class_name 
            FROM exam_eligibility ee
            JOIN students s ON ee.student_id = s.id
            WHERE ee.exam_schedule_id = ?
        `;
        
        const [rows] = await pool.query(query, [schedule_id]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error in getExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.addExamEligibility = async (req, res) => {
    try {
        const { exam_schedule_id, student_id, is_eligible, seat_row, seat_col } = req.body;
        
        if (!exam_schedule_id || !student_id) {
            return res.status(400).json({ success: false, message: 'Thiếu exam_schedule_id hoặc student_id' });
        }

        // Check if already exists
        const [existing] = await pool.query(
            'SELECT id FROM exam_eligibility WHERE exam_schedule_id = ? AND student_id = ?', 
            [exam_schedule_id, student_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Sinh viên đã có trong danh sách dự thi này' });
        }

        const [result] = await pool.query(
            'INSERT INTO exam_eligibility (exam_schedule_id, student_id, is_eligible, seat_row, seat_col) VALUES (?, ?, ?, ?, ?)',
            [exam_schedule_id, student_id, is_eligible !== undefined ? is_eligible : 1, seat_row || null, seat_col || null]
        );
        
        res.status(201).json({ success: true, message: 'Đã thêm sinh viên vào danh sách dự thi' });
    } catch (error) {
        console.error('Error in addExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.removeExamEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM exam_eligibility WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu' });
        }

        res.json({ success: true, message: 'Đã xóa sinh viên khỏi danh sách dự thi' });
    } catch (error) {
        console.error('Error in removeExamEligibility:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// --- EXAM ATTENDANCE ---

exports.getExamAttendance = async (req, res) => {
    try {
        const schedule_id = req.query.schedule_id;
        
        if (!schedule_id) {
            return res.status(400).json({ success: false, message: 'Thiếu schedule_id' });
        }

        const query = `
            SELECT ea.*, s.student_code, s.full_name, s.class_name 
            FROM exam_attendance ea
            JOIN students s ON ea.student_id = s.id
            WHERE ea.exam_schedule_id = ?
            ORDER BY ea.check_in_time DESC
        `;
        
        const [rows] = await pool.query(query, [schedule_id]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error in getExamAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.deleteExamAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM exam_attendance WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu điểm danh thi' });
        }

        res.json({ success: true, message: 'Đã xóa dữ liệu điểm danh thi' });
    } catch (error) {
        console.error('Error in deleteExamAttendance:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
