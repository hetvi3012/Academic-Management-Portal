const pool = require('../config/db');

// 1. CREATE COURSE IN CATALOG (Admin/Faculty)
exports.createCourse = async (req, res) => {
  const { courseCode, title, ltp, credits } = req.body;
  try {
    const newCourse = await pool.query(
      `INSERT INTO course_catalog (course_code, title, ltp, credits) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [courseCode, title, ltp, credits]
    );
    res.json(newCourse.rows[0]);
  } catch (err) {
    if (err.code === '23505') { 
        return res.status(400).json({ error: 'Course code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// 2. VIEW CATALOG (Everyone)
exports.getCatalog = async (req, res) => {
  try {
    const courses = await pool.query('SELECT * FROM course_catalog ORDER BY course_code');
    res.json(courses.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};