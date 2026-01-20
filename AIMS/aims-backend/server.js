const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---
// 1. Auth (Handles Login + User Creation + Advisor Assignment + Approvals)
//    Your api.js sends these admin tasks to /api/auth, so we route them there.
app.use('/api/auth', require('./routes/authRoutes'));

// 2. Admin (Handles Semesters + Lists + Course Catalog)
app.use('/api/admin', require('./routes/adminRoutes'));

// 3. Faculty (Handles Floating + My Offerings + Requests)
app.use('/api/faculty', require('./routes/facultyRoutes'));

// 4. Student (Handles Dashboard + Registration + Fees)
app.use('/api/student', require('./routes/studentRoutes'));

// 5. Academic (Optional/Legacy support)
app.use('/api/academic', require('./routes/academicRoutes'));

// Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'Server Running', db: 'Connected', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'DB Failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));