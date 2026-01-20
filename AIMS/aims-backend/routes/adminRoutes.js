const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const academicController = require('../controllers/academicController');
const auth = require('../middleware/authMiddleware');

// 1. User Lists
router.get('/students', auth(['admin']), adminController.getAllStudents);
router.get('/faculty-list', auth(['admin']), adminController.getAllFaculty);

// 2. Semesters
router.get('/semesters', auth(['admin']), adminController.getSemesters);
router.post('/semesters', auth(['admin']), adminController.createSemester);
router.post('/assign-advisor', auth(['admin']), adminController.assignAdvisor);
// 3. Courses (GET & POST)
// This matches "adminAPI.createCourse" AND "academicAPI.getCourses" in your api.js
router.get('/courses', academicController.getCatalog); // View Catalog
router.post('/courses', auth(['admin']), academicController.createCourse); // Create Course
router.get('/offerings/pending', auth(['admin']), adminController.getPendingOfferings);
router.post('/offerings/approve', auth(['admin']), adminController.approveOffering);
module.exports = router;