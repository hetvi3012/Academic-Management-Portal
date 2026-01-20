const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const adminController = require('../controllers/adminController'); // <--- ADD THIS
const auth = require('../middleware/authMiddleware');

// --- SEMESTERS (Admin Only) ---
router.post('/semesters', auth(['admin']), adminController.createSemester);
router.get('/semesters', auth(['admin']), adminController.getSemesters);

// --- COURSES ---
// Create Course: Allow both 'admin' AND 'faculty'
router.post('/courses', auth(['admin', 'faculty']), academicController.createCourse);

// View Catalog: Public (or authenticated users)
router.get('/courses', academicController.getCatalog);

module.exports = router;