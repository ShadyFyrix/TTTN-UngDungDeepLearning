require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: 'db',
        user: 'root',
        password: 'root',
        database: 'face_attendance_db',
        port: 3306,
    });

    try {
        const email = 'shadyfyrix@gmail.com';
        const password = 'lvson2005'; // Password is 'lvson2005'
        const full_name = 'Lvson';
        const username = 'Lvson';

        // Check if exists
        const [existing] = await connection.execute('SELECT * FROM administrators WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Account already exists! Updating it to be verified admin...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `UPDATE administrators SET password = ?, role = 'admin', is_email_verified = 1 WHERE email = ?`,
                [passwordHash, email]
            );
            console.log('Account updated successfully.');
        } else {
            console.log('Creating new admin account...');
            const passwordHash = await bcrypt.hash(password, 12);
            await connection.execute(
                `INSERT INTO administrators (username, full_name, email, password, role, is_email_verified) 
                 VALUES (?, ?, ?, ?, 'admin', 1)`,
                [username, full_name, email, passwordHash]
            );
            console.log('Admin account created successfully.');
        }
        
        console.log(`\n--- CREDENTIALS ---`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`-------------------\n`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

createAdmin();
