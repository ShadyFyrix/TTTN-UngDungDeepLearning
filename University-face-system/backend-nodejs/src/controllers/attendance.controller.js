const AiService = require('../services/ai.service');
const pool = require('../config/db');

exports.verifyAttendance = async (req, res) => {
    try {
        const { student_id, schedule_id, image_base64 } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        // 1. Gửi ảnh sang Python AI Service để xác thực
        const aiResponse = await AiService.verifyFace(student_id, image_base64);

        if (aiResponse.match) {
            // 2. Nếu khớp, lưu lịch sử điểm danh vào database
            // Kiểm tra xem schedule_id có được truyền lên không (điểm danh lớp học)
            if (schedule_id) {
                 const [result] = await pool.query(
                     'INSERT INTO class_attendance (student_id, schedule_id, check_in_time, status, confidence_score) VALUES (?, ?, NOW(), ?, ?)',
                     [student_id, schedule_id, 'Present', aiResponse.confidence]
                 );
            }
            // (Tuỳ chọn: Nếu là exam_schedule_id thì lưu vào exam_attendance)

            return res.status(200).json({
                success: true,
                message: 'Xác thực thành công',
                confidence: aiResponse.confidence
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Xác thực khuôn mặt thất bại. Không khớp với dữ liệu.',
                confidence: aiResponse.confidence
            });
        }
    } catch (error) {
        console.error('Lỗi verifyAttendance:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.registerFace = async (req, res) => {
    try {
        const { student_id, image_base64 } = req.body;

        if (!student_id || !image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu student_id hoặc image_base64' });
        }

        const aiResponse = await AiService.registerFace(student_id, image_base64);

        return res.status(200).json({
            success: true,
            message: 'Đăng ký khuôn mặt thành công'
        });
    } catch (error) {
        console.error('Lỗi registerFace:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.detectPose = async (req, res) => {
    try {
        const { image_base64 } = req.body;
        if (!image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu image_base64' });
        }
        const aiResponse = await AiService.detectPose(image_base64);
        return res.status(200).json(aiResponse);
    } catch (error) {
        console.error('Lỗi detectPose:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.registerFace3Step = async (req, res) => {
    try {
        const { student_id, image_straight, image_left, image_right } = req.body;
        
        if (!student_id || !image_straight || !image_left || !image_right) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin hoặc ảnh' });
        }

        const aiResponse = await AiService.registerFace3Step(student_id, image_straight, image_left, image_right);
        
        return res.status(200).json({
            success: true,
            message: 'Đăng ký khuôn mặt 3 bước thành công'
        });
    } catch (error) {
        console.error('Lỗi registerFace3Step:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký 3 bước' });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, student_code, full_name, class_name, (face_embedding IS NOT NULL) as has_face FROM students ORDER BY id DESC'
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Lỗi getStudents:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.quickCreateStudent = async (req, res) => {
    try {
        const { student_code, full_name, class_name, date_of_birth } = req.body;
        if (!student_code || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã Sinh Viên và Họ Tên' });
        }

        // Check if student already exists
        const [existing] = await pool.query(
            'SELECT id, student_code, full_name, class_name, (face_embedding IS NOT NULL) as has_face FROM students WHERE student_code = ?',
            [student_code]
        );

        if (existing.length > 0) {
            // Update info if provided
            if (class_name || full_name) {
                await pool.query(
                    'UPDATE students SET full_name = ?, class_name = COALESCE(?, class_name) WHERE id = ?',
                    [full_name, class_name || null, existing[0].id]
                );
            }
            return res.status(200).json({
                success: true,
                message: 'Đã cập nhật sinh viên sẵn có',
                data: {
                    id: existing[0].id,
                    student_code: existing[0].student_code,
                    full_name,
                    class_name: class_name || existing[0].class_name,
                    has_face: existing[0].has_face
                }
            });
        }

        const [result] = await pool.query(
            'INSERT INTO students (student_code, full_name, class_name, date_of_birth, status) VALUES (?, ?, ?, ?, ?)',
            [student_code, full_name, class_name || null, date_of_birth || null, 'Active']
        );

        return res.status(201).json({
            success: true,
            message: 'Tạo sinh viên mới thành công',
            data: {
                id: result.insertId,
                student_code,
                full_name,
                class_name,
                has_face: 0
            }
        });
    } catch (error) {
        console.error('Lỗi quickCreateStudent:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tạo sinh viên' });
    }
};

exports.autoIdentifyAndCheckIn = async (req, res) => {
    try {
        const { image_base64 } = req.body;
        if (!image_base64) {
            return res.status(400).json({ success: false, message: 'Thiếu image_base64' });
        }

        // 1. Send frame to AI Service for 1:N identification
        const aiRes = await AiService.identifyFace(image_base64);

        if (!aiRes.match || !aiRes.student_id) {
            return res.status(200).json({
                success: true,
                match: false,
                box: aiRes.box || null,
                image_size: aiRes.image_size || null,
                confidence: aiRes.confidence || 0,
                message: 'Chưa tìm thấy khuôn mặt phù hợp'
            });
        }

        // 2. Fetch student info
        const [studentRows] = await pool.query(
            'SELECT id, student_code, full_name, date_of_birth, class_name, status FROM students WHERE id = ?',
            [aiRes.student_id]
        );

        if (studentRows.length === 0) {
            return res.status(200).json({
                success: true,
                match: false,
                message: 'Không tìm thấy thông tin sinh viên'
            });
        }

        const student = studentRows[0];

        // 3. Class schedule attendance info
        const [classSchedules] = await pool.query(
            `SELECT cs.id as schedule_id, cs.room_name, cs.start_time, cs.end_time, c.course_code, c.course_name 
             FROM class_schedules cs 
             JOIN courses c ON cs.course_id = c.id 
             ORDER BY cs.id DESC LIMIT 1`
        );

        let classAttendanceInfo = null;
        if (classSchedules.length > 0) {
            const sched = classSchedules[0];
            const [existingClassAtt] = await pool.query(
                'SELECT * FROM class_attendance WHERE student_id = ? AND schedule_id = ?',
                [student.id, sched.schedule_id]
            );

            if (existingClassAtt.length === 0) {
                await pool.query(
                    'INSERT INTO class_attendance (student_id, schedule_id, check_in_time, status, confidence_score) VALUES (?, ?, NOW(), ?, ?)',
                    [student.id, sched.schedule_id, 'Present', aiRes.confidence]
                );
            }

            classAttendanceInfo = {
                course_code: sched.course_code,
                course_name: sched.course_name,
                room_name: sched.room_name,
                check_in_time: new Date().toLocaleTimeString('vi-VN'),
                status: 'Đã điểm danh bài giảng môn học'
            };
        } else {
            // Default active course attendance info for UI demo
            classAttendanceInfo = {
                course_code: 'COMP101',
                course_name: 'Lập Trình Trí Tuệ Nhân Tạo & Nhận Diện Khuôn Mặt',
                room_name: 'Phòng Lab 402',
                check_in_time: new Date().toLocaleTimeString('vi-VN'),
                status: 'Đã điểm danh tự động môn học ngày hôm nay'
            };
        }

        // 4. Exam schedule attendance info
        const [examSchedules] = await pool.query(
            `SELECT es.id as exam_schedule_id, es.exam_room, es.exam_time, c.course_code, c.course_name 
             FROM exam_schedules es 
             JOIN courses c ON es.course_id = c.id 
             ORDER BY es.id DESC LIMIT 1`
        );

        let examAttendanceInfo = null;
        if (examSchedules.length > 0) {
            const exam = examSchedules[0];
            const [elig] = await pool.query(
                'SELECT * FROM exam_eligibility WHERE exam_schedule_id = ? AND student_id = ?',
                [exam.exam_schedule_id, student.id]
            );

            const [existingExamAtt] = await pool.query(
                'SELECT * FROM exam_attendance WHERE student_id = ? AND exam_schedule_id = ?',
                [student.id, exam.exam_schedule_id]
            );

            let seatRow = elig.length > 0 ? elig[0].seat_row : 2;
            let seatCol = elig.length > 0 ? elig[0].seat_col : 5;
            let isEligible = elig.length > 0 ? elig[0].is_eligible === 1 : true;

            if (existingExamAtt.length === 0) {
                await pool.query(
                    'INSERT INTO exam_attendance (student_id, exam_schedule_id, check_in_time, is_verified, seat_row, seat_col) VALUES (?, ?, NOW(), 1, ?, ?)',
                    [student.id, exam.exam_schedule_id, seatRow, seatCol]
                );
            }

            examAttendanceInfo = {
                course_code: exam.course_code,
                course_name: exam.course_name,
                exam_room: exam.exam_room,
                seat: `Hàng ${seatRow} - Ghế ${seatCol}`,
                is_eligible: isEligible,
                status: isEligible ? 'Hợp lệ - Đã check-in dự thi' : '⚠️ KHÔNG đủ điều kiện thi'
            };
        } else {
            // Default exam attendance demo info
            examAttendanceInfo = {
                course_code: 'COMP101',
                course_name: 'Thi Cuối Kỳ Nhập Môn AI',
                exam_room: 'Phòng Hội Trường B1',
                seat: 'Hàng 2 - Ghế 15',
                is_eligible: true,
                status: 'Đủ điều kiện thi - Đã xác thực thành công'
            };
        }

        return res.status(200).json({
            success: true,
            match: true,
            box: aiRes.box || null,
            image_size: aiRes.image_size || null,
            confidence: aiRes.confidence,
            student,
            class_attendance: classAttendanceInfo,
            exam_attendance: examAttendanceInfo,
            message: `Tự động xác thực thành công sinh viên ${student.full_name} (${student.student_code})`
        });

    } catch (error) {
        console.error('Lỗi autoIdentifyAndCheckIn:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi tự động nhận diện sinh viên' });
    }
};


