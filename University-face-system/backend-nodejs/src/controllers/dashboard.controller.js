const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Lấy tổng số lượng từ các bảng
        const [studentCount] = await pool.query('SELECT COUNT(*) as total FROM students');
        const [courseCount] = await pool.query('SELECT COUNT(*) as total FROM courses');
        const [classCount] = await pool.query('SELECT COUNT(*) as total FROM class_schedules');
        const [examCount] = await pool.query('SELECT COUNT(*) as total FROM exam_schedules');

        // 2. Lấy 5 lượt điểm danh lớp học mới nhất
        const classAttendanceQuery = `
            SELECT ca.id, ca.check_in_time, ca.status, ca.confidence_score, 
                   s.student_code, s.full_name, 
                   cs.room_name, c.course_name
            FROM class_attendance ca
            JOIN students s ON ca.student_id = s.id
            JOIN class_schedules cs ON ca.schedule_id = cs.id
            JOIN courses c ON cs.course_id = c.id
            ORDER BY ca.check_in_time DESC
            LIMIT 5
        `;
        const [recentClassAttendance] = await pool.query(classAttendanceQuery);

        // 3. Lấy 5 lượt điểm danh thi mới nhất
        const examAttendanceQuery = `
            SELECT ea.id, ea.check_in_time, ea.is_verified, 
                   s.student_code, s.full_name, 
                   es.exam_room, c.course_name
            FROM exam_attendance ea
            JOIN students s ON ea.student_id = s.id
            JOIN exam_schedules es ON ea.exam_schedule_id = es.id
            JOIN courses c ON es.course_id = c.id
            ORDER BY ea.check_in_time DESC
            LIMIT 5
        `;
        const [recentExamAttendance] = await pool.query(examAttendanceQuery);

        res.json({
            success: true,
            data: {
                counts: {
                    students: studentCount[0].total,
                    courses: courseCount[0].total,
                    classes: classCount[0].total,
                    exams: examCount[0].total,
                },
                recentActivity: {
                    classes: recentClassAttendance,
                    exams: recentExamAttendance
                }
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu tổng quan' });
    }
};
