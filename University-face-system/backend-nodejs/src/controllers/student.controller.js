const pool = require('../config/db');

exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT id, student_code, full_name, date_of_birth, class_name, status, face_embedding FROM students';
        let countQuery = 'SELECT COUNT(*) as total FROM students';
        const queryParams = [];

        if (search) {
            const searchCondition = ' WHERE student_code LIKE ? OR full_name LIKE ? OR class_name LIKE ?';
            query += searchCondition;
            countQuery += searchCondition;
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
        const total = countResult[0].total;

        // Xử lý face_embedding sang base64 nếu có
        const formattedRows = rows.map(student => {
            let embeddingBase64 = null;
            if (student.face_embedding) {
                // Nếu buffer hợp lệ thì chuyển đổi sang chuỗi base64
                embeddingBase64 = Buffer.from(student.face_embedding).toString('base64');
            }
            return {
                ...student,
                face_embedding: embeddingBase64
            };
        });

        res.json({
            success: true,
            data: formattedRows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllStudents:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sinh viên' });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
        }

        const student = rows[0];
        if (student.face_embedding) {
            student.face_embedding = Buffer.from(student.face_embedding).toString('base64');
        }

        res.json({ success: true, data: student });
    } catch (error) {
        console.error('Error in getStudentById:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { student_code, full_name, date_of_birth, class_name, status } = req.body;
        
        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền mã sinh viên và họ tên' });
        }

        const [existing] = await pool.query('SELECT id FROM students WHERE student_code = ?', [student_code]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã sinh viên đã tồn tại' });
        }

        const [result] = await pool.query(
            'INSERT INTO students (student_code, full_name, date_of_birth, class_name, status) VALUES (?, ?, ?, ?, ?)',
            [student_code, full_name, date_of_birth || null, class_name || null, status || 'Active']
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Tạo sinh viên thành công',
            data: { id: result.insertId, student_code, full_name }
        });
    } catch (error) {
        console.error('Error in createStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên' });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_code, full_name, date_of_birth, class_name, status } = req.body;

        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền mã sinh viên và họ tên' });
        }

        // Check if new student code belongs to another student
        const [existing] = await pool.query('SELECT id FROM students WHERE student_code = ? AND id != ?', [student_code, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã sinh viên đã được sử dụng bởi người khác' });
        }

        const [result] = await pool.query(
            'UPDATE students SET student_code = ?, full_name = ?, date_of_birth = ?, class_name = ?, status = ? WHERE id = ?',
            [student_code, full_name, date_of_birth || null, class_name || null, status || 'Active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để cập nhật' });
        }

        res.json({ success: true, message: 'Cập nhật sinh viên thành công' });
    } catch (error) {
        console.error('Error in updateStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật sinh viên' });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deletion if there is attendance data
        const [classAtt] = await pool.query('SELECT id FROM class_attendance WHERE student_id = ? LIMIT 1', [id]);
        if (classAtt.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa sinh viên này vì đã có dữ liệu điểm danh lớp' });
        }

        const [examAtt] = await pool.query('SELECT id FROM exam_attendance WHERE student_id = ? LIMIT 1', [id]);
        if (examAtt.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa sinh viên này vì đã có dữ liệu điểm danh thi' });
        }

        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên để xóa' });
        }

        res.json({ success: true, message: 'Xóa sinh viên thành công' });
    } catch (error) {
        console.error('Error in deleteStudent:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa sinh viên' });
    }
};
