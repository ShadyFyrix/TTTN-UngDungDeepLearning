const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');

// Verify face for attendance/exam (1:1 specific student)
router.post('/attendance/verify', attendanceController.verifyAttendance);

// Automatic 1:N face identification & auto check-in
router.post('/attendance/auto-verify', attendanceController.autoIdentifyAndCheckIn);


// Optional: Register face for a student (Admin/Setup)
router.post('/student/register-face', attendanceController.registerFace);

// Detect face pose
router.post('/face/detect-pose', attendanceController.detectPose);

// Register 3-step face
router.post('/face/register-3step', attendanceController.registerFace3Step);

// Student helpers for face registration & recognition UI
router.get('/student-list', attendanceController.getStudents);
router.post('/student/quick-create', attendanceController.quickCreateStudent);

module.exports = router;


