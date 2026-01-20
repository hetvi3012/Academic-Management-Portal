const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const auth = require('../middleware/authMiddleware');

// Course Management
router.post('/float', auth(['faculty']), facultyController.floatCourse);
router.get('/offerings', auth(['faculty']), facultyController.getMyOfferings);

// Student Requests (Instructor Role)
router.get('/requests/instructor', auth(['faculty']), facultyController.getInstructorRequests);
router.post('/action/instructor', auth(['faculty']), facultyController.handleInstructorAction);

// Advisee Requests (Advisor Role)
router.get('/requests/advisor', auth(['faculty']), facultyController.getAdvisorRequests);
router.post('/action/advisor', auth(['faculty']), facultyController.handleAdvisorAction);
router.post('/grade', auth(['faculty']), facultyController.updateStudentGrade);
router.post('/complete', auth(['faculty']), facultyController.completeCourse);
// 2. Grading & Completion (*** NEW ROUTES ***)
router.get('/course/:offeringId/students', auth(['faculty']), facultyController.getCourseStudents);
router.post('/grade', auth(['faculty']), facultyController.updateStudentGrade);
router.post('/complete', auth(['faculty']), facultyController.completeCourse);
module.exports = router;