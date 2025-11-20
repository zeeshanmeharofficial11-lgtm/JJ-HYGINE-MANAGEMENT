const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection - UPDATE THESE WITH YOUR DATABASE INFO
const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_database_name',
  password: 'your_db_password',
  port: 5432,
});

// API endpoint for checklists
app.get('/api/checklists', async (req, res) => {
  try {
    const { branch, date, employee_type } = req.query;
    let query = 'SELECT * FROM checklists WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (branch) {
      paramCount++;
      query += ` AND branch = $${paramCount}`;
      values.push(branch);
    }

    if (date) {
      paramCount++;
      query += ` AND date = $${paramCount}`;
      values.push(date);
    }

    if (employee_type) {
      paramCount++;
      query += ` AND employee_type = $${paramCount}`;
      values.push(employee_type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});