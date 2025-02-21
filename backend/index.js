const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment-timezone');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

const upload = multer({ dest: 'uploads/' });

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhoneNumber = (phoneNumber) => {
  const re = /^\d{10}$/;
  return re.test(String(phoneNumber));
};

app.post('/api/contacts/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const processedData = rows.map((row, index) => {
      const name = row["name"] || "";
      const email = row["email"] || "";
      const phone_number = String(row["phone_number"] || row["phone"] || "");
      const address = row["address"] || "";
      const city = row["city"] || "";
      const notes = row["notes"] || "";

      const errors = [];
      if (!name.trim()) errors.push("Name is required");
      if (!email.trim()) {
        errors.push("Email is required");
      } else if (!validateEmail(email)) {
        errors.push("Invalid email format");
      }
      if (!phone_number.trim()) {
        errors.push("Phone number is required");
      } else if (!validatePhoneNumber(phone_number)) {
        errors.push("Invalid phone number format");
      }

      return {
        row: index + 2, 
        name,
        email,
        phone_number,
        address,
        city,
        notes,
        errors: errors.length > 0 ? errors : null
      };
    });

    fs.unlinkSync(filePath);

    res.json({ success: true, data: processedData });
  } catch (error) {
    fs.unlinkSync(filePath);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contacts/download', (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of error objects.' });
  }

  try {

   const formattedData = data.map(item => {
      if (item.errors) {
        return {
          ...item,
          errors: item.errors?.join(', ')
        };
      }
      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="export.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/contacts/upload', async (req, res) => {
  const contacts = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const results = [];
  for (const [index, contact] of contacts.entries()) {
    const { name, email, phone_number, address, city, notes } = contact;
    try {
      await db.promise().query(
        'INSERT INTO contacts (name, email, phone_number, address, city, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone_number, address, city, notes]
      );
      results.push({ row: index + 1, success: true });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const error = err.sqlMessage.includes('email') ? `Duplicate email: ${email}` : `Duplicate phone number: ${phone_number}`;
        const errors = [error];
        results.push({ row: index + 1, errors });
      } else {
        results.push({ row: index + 1, errors: err.message });
      }
    }
  }

  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success);
  res.json({ success: true, inserted: successes, failed: failures.length, failures });
});

app.get('/api/contacts', async (req, res) => {
  const { page = 1, limit = 10, search = '', sortBy = 'name', order = 'asc' } = req.query;
  console.log(req.query);
  const offset = (page - 1) * limit;
  const searchTerm = `%${search}%`;
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const allowedSortFields = ['name', 'email', 'phone_number', 'city'];

  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({ error: 'Invalid sort field' });
  }

  const [countResult] = await db.promise().query(
    'SELECT COUNT(*) as total FROM contacts WHERE name LIKE ? OR email LIKE ? OR phone_number LIKE ?',
    [searchTerm, searchTerm, searchTerm]
  );
  const total = countResult[0].total;
  const [contacts] = await db.promise().query(
    `SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR phone_number LIKE ?
     ORDER BY ${sortBy} ${sortOrder} LIMIT ?, ?`,
    [searchTerm, searchTerm, searchTerm, offset, parseInt(limit)]
  );
  res.json({ contacts, total });
});

app.get('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const [contacts] = await db.promise().query('SELECT * FROM contacts WHERE id = ?', [id]);
  if (contacts.length === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  res.json(contacts[0]);
});

app.put('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone_number, address, city, notes, last_modified } = req.body;
  const localDate = moment.tz(last_modified, 'Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  try {
    const [result] = await db.promise().query(
      'UPDATE contacts SET name = ?, email = ?, phone_number = ?, address = ?, city = ?, notes = ? WHERE id = ? AND last_modified = ?',
      [name, email, phone_number, address, city, notes, id, localDate]
    );
    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'Conflict: Contact modified by another user' });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const field = err.sqlMessage.includes('email') ? 'Email' : 'Phone number';
      return res.status(400).json({ error: `${field} already in use` });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  await db.promise().query('DELETE FROM contacts WHERE id = ?', [id]);
  res.json({ success: true });
});

app.delete('/api/contacts', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  await db.promise().query('DELETE FROM contacts WHERE id IN (?)', [ids]);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
