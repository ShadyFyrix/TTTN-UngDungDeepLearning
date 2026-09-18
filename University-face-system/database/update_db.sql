DROP TABLE IF EXISTS administrators;
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
