const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'manager'));

// --- Class Schedules ---
router.get('/schedules', classController.getAllClassSchedules);
router.get('/schedules/:id', classController.getClassScheduleById);
router.post('/schedules', classController.createClassSchedule);
router.put('/schedules/:id', classController.updateClassSchedule);
router.delete('/schedules/:id', classController.deleteClassSchedule);

// --- Class Attendance ---
router.get('/attendance', classController.getAllClassAttendance);
router.delete('/attendance/:id', classController.deleteClassAttendance);

module.exports = router;
