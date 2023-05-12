const mysql = require('mysql2/promise');

// koneksi ke database
const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    database: process.env.MYSQL_DBNAME || 'hello',
    password: process.env.MYSQL_PASSWORD || 'root',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// migrasi database
const migration = async () => {
    try {

        await db.query(
            `
            CREATE TABLE IF NOT EXISTS activities (
            activity_id int not null auto_increment,
            title varchar(255) not null,
            email varchar(255) not null,
            createdAt timestamp not null default current_timestamp(),
            updatedAt timestamp not null default current_timestamp(),
            primary key (activity_id)
            )
        `
        );

        await db.query(
            `
            CREATE TABLE IF NOT EXISTS todos (
                todo_id INT PRIMARY KEY AUTO_INCREMENT,
                activity_group_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT true,
                priority VARCHAR(20),
                createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
                updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW()
              )
        `
        );

        console.log('Running Migration Successfully!');
    } catch (err) {
        throw err;
    }
};

module.exports = { db, migration };
