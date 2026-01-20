const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/authMiddleware');

// Dashboard & Courses
router.get('/offerings', auth(['student']), studentController.getOfferings);
router.get('/my-courses', auth(['student']), studentController.getMyCourses);

// Registration & Fees
router.post('/pay-fees', auth(['student']), studentController.payFees);
router.post('/register', auth(['student']), studentController.registerCourse);
router.get('/fees/status', auth(['student']), studentController.getFeeStatus);
module.exports = router;