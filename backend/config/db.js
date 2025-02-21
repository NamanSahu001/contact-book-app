const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'contact_book'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
  db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      address VARCHAR(255),
      city VARCHAR(100),
      notes TEXT,
      last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, err => { if (err) throw err; });
});

module.exports = db;