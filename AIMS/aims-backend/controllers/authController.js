const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Email Transporter
// NOTE: For real gmail, you need an App Password. For testing, we use Ethereal (fake email).
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@ethereal.email', // Replace with real credentials later
        pass: 'ethereal.pass'
    }
});

// 1. GENERATE & SEND OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Contact Admin.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins expiry

    // Save to DB
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3',
      [otp, expiry, email]
    );

    // Send Email (Console log for easy testing without real email)
    console.log(`>>> OTP for ${email}: ${otp}`); 
    
    // Uncomment this to actually send email later
    // await transporter.sendMail({
    //   from: '"AIMS Admin" <noreply@aims.com>',
    //   to: email,
    //   subject: 'Login OTP',
    //   text: `Your OTP is ${otp}`
    // });


    res.json({ message: 'OTP sent (Check server console for code)' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// 2. VERIFY OTP & LOGIN
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = result.rows[0];

    // Validate
    if (user.otp_code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(user.otp_expires_at)) return res.status(400).json({ error: 'OTP Expired' });

    // Clear OTP
    await pool.query('UPDATE users SET otp_code = NULL WHERE email = $1', [email]);

    // Issue Token
    const payload = { id: user.id, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.json({ token, user: payload });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};