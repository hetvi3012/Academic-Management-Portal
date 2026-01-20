const pool = require('../config/db');

// 1. VIEW AVAILABLE COURSES (Only Active/Approved)
exports.getOfferings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT co.id, co.course_code, c.title, c.credits, 
             co.slot, co.seat_limit, co.status,
             u.name as instructor
      FROM course_offerings co
      JOIN course_catalog c ON co.course_code = c.course_code
      JOIN users u ON co.instructor_id = u.id
      WHERE co.status = 'active'
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 2. PAY FEES (Mock Implementation)
exports.payFees = async (req, res) => {
  const studentId = req.user.id; // From authMiddleware
  try {
    await pool.query(
      `INSERT INTO fee_payments (student_id, semester_code, amount, transaction_ref)
       VALUES ($1, '2026-W', 50000, 'TXN_' || floor(random() * 1000000))`,
      [studentId]
    );
    res.json({ message: 'Fees paid successfully for 2026-W' });
  } catch (err) {
    res.status(400).json({ error: 'Fees already paid or Error processing.' });
  }
};

// 3. REGISTER FOR A COURSE
exports.registerCourse = async (req, res) => {
  const studentId = req.user.id;
  const { offeringId } = req.body;

  try {
    // A. Check Fee Payment Status
    const feeCheck = await pool.query(
      "SELECT * FROM fee_payments WHERE student_id = $1 AND semester_code = '2026-W'",
      [studentId]
    );
    
    if (feeCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Fee Payment Pending. Cannot Register.' });
    }

    // B. Insert Enrollment (Status: pending_instructor)
    await pool.query(
      `INSERT INTO enrollments (student_id, offering_id, status, category)
       VALUES ($1, $2, 'pending_instructor', 'core')`,
      [studentId, offeringId]
    );

    res.json({ message: 'Request sent to Instructor for approval.' });

  } catch (err) {
    // Handle Duplicate Key Error (Already registered)
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Request already sent or registered.' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 4. VIEW MY REGISTERED COURSES
exports.getMyCourses = async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT e.id, e.status, e.category, e.offering_id,
              co.course_code, c.title, c.credits, 
              co.slot, u.name as instructor
       FROM enrollments e
       JOIN course_offerings co ON e.offering_id = co.id
       JOIN course_catalog c ON co.course_code = c.course_code
       JOIN users u ON co.instructor_id = u.id
       WHERE e.student_id = $1`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. CHECK FEE STATUS (Add this to the end of the file)
exports.getFeeStatus = async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT * FROM fee_payments WHERE student_id = $1 AND semester_code = '2026-W'",
      [studentId]
    );
    // If a record exists, fees are paid (true). Else, pending (false).
    res.json({ paid: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};