const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager'));

// --- Exam Schedules ---
router.get('/schedules', examController.getAllExamSchedules);
router.get('/schedules/:id', examController.getExamScheduleById);
router.post('/schedules', examController.createExamSchedule);
router.put('/schedules/:id', examController.updateExamSchedule);
router.delete('/schedules/:id', examController.deleteExamSchedule);

// --- Exam Eligibility (Danh sách dự thi) ---
router.get('/eligibility', examController.getExamEligibility);
router.post('/eligibility', examController.addExamEligibility);
router.delete('/eligibility/:id', examController.removeExamEligibility);

// --- Exam Attendance (Điểm danh thi) ---
router.get('/attendance', examController.getExamAttendance);
router.delete('/attendance/:id', examController.deleteExamAttendance);

module.exports = router;
