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
    const result = await pool.query(`
      SELECT co.*, c.title,
      (SELECT COUNT(*) FROM enrollments e WHERE e.offering_id = co.id AND e.status = 'enrolled') as enrolled_count
      FROM course_offerings co
      JOIN course_catalog c ON co.course_code = c.course_code
      WHERE co.instructor_id = $1
      ORDER BY co.id DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCourseStudents = async (req, res) => {
  const { offeringId } = req.params;
  try {
    // Verify instructor owns this course
    const check = await pool.query("SELECT id FROM course_offerings WHERE id = $1 AND instructor_id = $2", [offeringId, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    const result = await pool.query(`
      SELECT e.id as enrollment_id, s.entry_number, u.name, e.grade, e.status
      FROM enrollments e
      JOIN students s ON e.student_id = s.user_id
      JOIN users u ON s.user_id = u.id
      WHERE e.offering_id = $1 AND e.status = 'enrolled'
      ORDER BY s.entry_number ASC
    `, [offeringId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. UPDATE GRADE
exports.updateStudentGrade = async (req, res) => {
  const { enrollmentId, grade } = req.body;
  try {
    // Ensure the enrollment belongs to a course taught by this instructor
    const verify = await pool.query(`
      SELECT e.id FROM enrollments e
      JOIN course_offerings co ON e.offering_id = co.id
      WHERE e.id = $1 AND co.instructor_id = $2
    `, [enrollmentId, req.user.id]);

    if (verify.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    await pool.query("UPDATE enrollments SET grade = $1 WHERE id = $2", [grade, enrollmentId]);
    res.json({ message: "Grade updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. MARK COURSE AS COMPLETED
exports.completeCourse = async (req, res) => {
  const { offeringId } = req.body;
  try {
    await pool.query(
      "UPDATE course_offerings SET status = 'completed' WHERE id = $1 AND instructor_id = $2",
      [offeringId, req.user.id]
    );
    res.json({ message: "Course marked as Completed" });
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

// ... existing code ...

// [NEW] Update a student's grade
exports.updateStudentGrade = async (req, res) => {
  const { enrollmentId, grade } = req.body;
  const instructorId = req.user.id;

  try {
    // Security Check: Ensure instructor teaches this student's course
    const verify = await pool.query(`
      SELECT e.id FROM enrollments e
      JOIN course_offerings co ON e.offering_id = co.id
      WHERE e.id = $1 AND co.instructor_id = $2
    `, [enrollmentId, instructorId]);

    if (verify.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    // Update Grade
    await pool.query("UPDATE enrollments SET grade = $1 WHERE id = $2", [grade, enrollmentId]);
    res.json({ message: "Grade updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [NEW] Mark course as completed
exports.completeCourse = async (req, res) => {
  const { offeringId } = req.body;
  const instructorId = req.user.id;

  try {
    await pool.query(
      "UPDATE course_offerings SET status = 'completed' WHERE id = $1 AND instructor_id = $2",
      [offeringId, instructorId]
    );
    res.json({ message: "Course marked as Completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};