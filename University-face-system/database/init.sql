CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;

CREATE TABLE courses (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL
);

CREATE TABLE students (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    class_name VARCHAR(50),
    face_embedding BLOB,
    status VARCHAR(20)
);

CREATE TABLE class_schedules (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT(20),
    room_name VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE class_attendance (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT(20),
    schedule_id BIGINT(20),
    check_in_time DATETIME,
    status VARCHAR(20),
    confidence_score FLOAT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id)
);

CREATE TABLE exam_schedules (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT(20),
    exam_room VARCHAR(50),
    exam_time DATETIME,
    seating_rows INT(11),
    seating_cols INT(11),
    disabled_seats TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE exam_eligibility (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id BIGINT(20),
    student_id BIGINT(20),
    is_eligible TINYINT(1) DEFAULT 1,
    seat_row INT(11),
    seat_col INT(11),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE exam_attendance (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT(20),
    exam_schedule_id BIGINT(20),
    check_in_time DATETIME,
    is_verified TINYINT(1) DEFAULT 0,
    seat_row INT(11),
    seat_col INT(11),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
);

CREATE TABLE administrators (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('user', 'admin', 'sales', 'teacher', 'manager', 'accountant') DEFAULT 'admin',
    is_email_verified TINYINT(1) DEFAULT 0,
    email_verify_token VARCHAR(255),
    email_verify_expires DATETIME,
    refresh_token_hash VARCHAR(255),
    password_reset_token_hash VARCHAR(255),
    password_reset_expires DATETIME,
    last_login_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
