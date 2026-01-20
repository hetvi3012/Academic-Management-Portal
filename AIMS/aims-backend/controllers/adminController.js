const pool = require('../config/db');

// --- 1. USER CREATION (Required by api.js -> authAPI) ---

exports.addStudent = async (req, res) => {
  const { name, email, entryNumber, department, batchYear } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Create User
    const userRes = await client.query(
      "INSERT INTO users (name, email, role) VALUES ($1, $2, 'student') RETURNING id",
      [name, email]
    );
    const userId = userRes.rows[0].id;

    // 2. Create Student Profile
    await client.query(
      "INSERT INTO students (user_id, entry_number, department, batch_year) VALUES ($1, $2, $3, $4)",
      [userId, entryNumber, department, batchYear]
    );

    await client.query('COMMIT');
    res.json({ message: 'Student created successfully', userId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.addFaculty = async (req, res) => {
  const { name, email, department, designation } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Create User
    const userRes = await client.query(
      "INSERT INTO users (name, email, role) VALUES ($1, $2, 'faculty') RETURNING id",
      [name, email]
    );
    const userId = userRes.rows[0].id;

    // 2. Create Faculty Profile
    await client.query(
      "INSERT INTO faculty (user_id, department, designation) VALUES ($1, $2, $3)",
      [userId, department, designation]
    );

    await client.query('COMMIT');
    res.json({ message: 'Faculty added successfully', userId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// --- 2. LISTS & MANAGEMENT ---

exports.getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.user_id, u.name, u.email, s.entry_number, s.department, s.batch_year,
             f_user.name as advisor_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users f_user ON s.faculty_advisor_id = f_user.id
      ORDER BY s.entry_number ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaculty = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.user_id, u.name, u.email, f.department, f.designation 
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      ORDER BY u.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSemesters = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM semesters ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    if (err.code === '42P01') return res.json([]);
    res.status(500).json({ error: err.message });
  }
};

exports.createSemester = async (req, res) => {
  const { semesterCode, year, term, startDate, endDate } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO semesters (semester_code, year, term, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [semesterCode, year, term, startDate, endDate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignAdvisor = async (req, res) => {
  const { studentEntryNum, facultyEmail } = req.body;
  try {
    const facultyRes = await pool.query('SELECT id FROM users WHERE email = $1 AND role = $2', [facultyEmail, 'faculty']);
    if (facultyRes.rows.length === 0) return res.status(404).json({ error: 'Faculty not found' });
    
    const facultyId = facultyRes.rows[0].id;
    const updateRes = await pool.query(
      'UPDATE students SET faculty_advisor_id = $1 WHERE entry_number = $2 RETURNING user_id',
      [facultyId, studentEntryNum]
    );
    
    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Advisor assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingOfferings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT co.id, co.course_code, co.semester_code, co.status, co.seat_limit, co.slot,
             c.title, u.name as instructor
      FROM course_offerings co
      JOIN course_catalog c ON co.course_code = c.course_code
      JOIN users u ON co.instructor_id = u.id
      WHERE co.status = 'proposed'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveOffering = async (req, res) => {
  const { offeringId, action } = req.body; 
  const newStatus = action === 'approve' ? 'active' : 'rejected';
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const offeringRes = await client.query(
      'UPDATE course_offerings SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, offeringId]
    );
    
    if (offeringRes.rowCount === 0) throw new Error("Offering not found");

    // Auto-enrollment logic if needed
    const offering = offeringRes.rows[0];
    if (action === 'approve' && offering.core_batches && offering.core_departments) {
       const studentsToEnroll = await client.query(
         `SELECT user_id FROM students WHERE batch_year = ANY($1) AND department = ANY($2)`,
         [offering.core_batches, offering.core_departments]
       );
       for (let student of studentsToEnroll.rows) {
         await client.query(
           `INSERT INTO enrollments (student_id, offering_id, status, category)
            VALUES ($1, $2, 'enrolled', 'core')
            ON CONFLICT (student_id, offering_id) DO NOTHING`,
           [student.user_id, offeringId]
         );
       }
    }
    
    await client.query('COMMIT');
    res.json({ message: `Course offering ${newStatus}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};