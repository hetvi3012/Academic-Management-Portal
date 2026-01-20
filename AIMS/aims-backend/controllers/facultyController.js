const pool = require('../config/db');

// 1. FLOAT COURSE (Propose a new offering)
exports.floatCourse = async (req, res) => {
  const { 
    courseCode, semester, slot, seatLimit, 
    allowedBatches, allowedDepartments, 
    coreBatches, coreDepartments 
  } = req.body;
  
  const instructorId = req.user.id; 

  try {
    const offering = await pool.query(
      `INSERT INTO course_offerings 
       (course_code, semester_code, instructor_id, slot, seat_limit, status, 
        allowed_batches, allowed_departments, core_batches, core_departments) 
       VALUES ($1, $2, $3, $4, $5, 'proposed', $6, $7, $8, $9) RETURNING *`,
      [courseCode, semester, instructorId, slot, seatLimit, allowedBatches, allowedDepartments, coreBatches, coreDepartments]
    );
    
    res.json({ 
      message: 'Course floated. Core students will be auto-enrolled upon Admin Approval.',
      offering: offering.rows[0] 
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Already offered.' });
    res.status(500).json({ error: err.message });
  }
};

// 2. VIEW MY OFFERINGS (Consolidated)
exports.getMyOfferings = async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    const query = `
      SELECT 
        co.id, 
        co.course_code, 
        co.semester_code, 
        co.seat_limit, 
        co.slot,
        co.status,
        c.title,
        (
          SELECT COUNT(*) 
          FROM enrollments e 
          WHERE e.offering_id = co.id AND e.status = 'enrolled'
        ) as enrolled_count
      FROM course_offerings co
      JOIN course_catalog c ON co.course_code = c.course_code
      WHERE co.instructor_id = $1
      ORDER BY co.id DESC;
    `;
    
    const result = await pool.query(query, [instructorId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. VIEW PENDING REQUESTS (As Instructor)
exports.getInstructorRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, s.entry_number, u.name as student_name, c.title, c.course_code
       FROM enrollments e
       JOIN students s ON e.student_id = s.user_id
       JOIN users u ON s.user_id = u.id
       JOIN course_offerings co ON e.offering_id = co.id
       JOIN course_catalog c ON co.course_code = c.course_code
       WHERE co.instructor_id = $1 AND e.status = 'pending_instructor'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. ACTION REQUEST (Instructor: Approve/Reject)
exports.handleInstructorAction = async (req, res) => {
  const { enrollmentId, action } = req.body; 
  // If approved -> pending_faculty_advisor. If rejected -> rejected.
  const newStatus = action === 'approve' ? 'pending_faculty_advisor' : 'rejected';

  try {
    // Verify this enrollment belongs to a course TAUGHT by this user
    await pool.query(
      `UPDATE enrollments SET status = $1 
       WHERE id = $2 AND offering_id IN (SELECT id FROM course_offerings WHERE instructor_id = $3)`,
      [newStatus, enrollmentId, req.user.id]
    );
    res.json({ message: `Request ${action}ed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. VIEW ADVISEE REQUESTS (As Faculty Advisor)
exports.getAdvisorRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, s.entry_number, u.name, c.title, c.course_code
       FROM enrollments e
       JOIN students s ON e.student_id = s.user_id
       JOIN users u ON s.user_id = u.id
       JOIN course_offerings co ON e.offering_id = co.id
       JOIN course_catalog c ON co.course_code = c.course_code
       WHERE s.faculty_advisor_id = $1 AND e.status = 'pending_faculty_advisor'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. ACTION ADVISOR REQUEST (Advisor: Final Approval)
exports.handleAdvisorAction = async (req, res) => {
  const { enrollmentId, action } = req.body;
  const newStatus = action === 'approve' ? 'enrolled' : 'rejected';

  try {
    await pool.query(
      `UPDATE enrollments SET status = $1
       WHERE id = $2 AND student_id IN (SELECT user_id FROM students WHERE faculty_advisor_id = $3)`,
      [newStatus, enrollmentId, req.user.id]
    );
    res.json({ message: `Student ${action === 'approve' ? 'Enrolled' : 'Rejected'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};