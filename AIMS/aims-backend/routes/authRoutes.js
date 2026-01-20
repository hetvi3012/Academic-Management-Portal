const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController'); // Reuse Admin Logic
const auth = require('../middleware/authMiddleware');

// 1. Standard Auth
router.post('/send-otp', authController.sendOtp); 
router.post('/login', authController.verifyOtp);

// --- 2. ADMIN TASKS (Mapped to /auth to match api.js) ---

// User Creation
router.post('/add-faculty', auth(['admin']), adminController.addFaculty);
router.post('/add-student', auth(['admin']), adminController.addStudent);

// Advisor Assignment
router.post('/assign-advisor', auth(['admin']), adminController.assignAdvisor);

// Course Offering Approvals
router.get('/offerings/pending', auth(['admin']), adminController.getPendingOfferings);
router.post('/offerings/approve', auth(['admin']), adminController.approveOffering);

module.exports = router;