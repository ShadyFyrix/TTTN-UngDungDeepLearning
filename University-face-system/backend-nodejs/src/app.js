const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const studentRoutes = require('./routes/student.routes');
const classRoutes = require('./routes/class.routes');
const examRoutes = require('./routes/exam.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorMiddleware = require('./middleware/error.middleware');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: "Quá nhiều request. Vui lòng thử lại sau.",
    },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', apiRoutes);

app.use(errorMiddleware);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Backend API Gateway' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
