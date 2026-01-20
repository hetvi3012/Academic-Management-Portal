-- 1. CLEANUP
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS course_offerings CASCADE;
DROP TABLE IF EXISTS course_catalog CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;

-- 2. USERS (Updated for OTP Login)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'faculty', 'student')),
    
    -- AUTH COLUMNS (This is what was missing!)
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS
CREATE TABLE students (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    entry_number VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    batch_year INT NOT NULL,
    faculty_advisor_id INT REFERENCES users(id), -- Link to Faculty User
    cgpa NUMERIC(4,2) DEFAULT 0.0
);

-- 4. FACULTY
CREATE TABLE faculty (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50)
);

-- 5. COURSE CATALOG
CREATE TABLE course_catalog (
    course_code VARCHAR(10) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    ltp VARCHAR(10), 
    credits NUMERIC(3,1) NOT NULL
);

-- 6. COURSE OFFERINGS (With Batch/Branch Logic)
CREATE TABLE course_offerings (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(10) REFERENCES course_catalog(course_code),
    instructor_id INT REFERENCES users(id),
    semester_code VARCHAR(20) NOT NULL,
    slot VARCHAR(5),
    seat_limit INT DEFAULT 60,
    
    status VARCHAR(20) DEFAULT 'proposed', -- 'proposed', 'active', 'rejected'
    
    -- Restriction Arrays
    allowed_batches INT[],
    allowed_departments VARCHAR[],
    
    -- Auto-Enrollment Arrays
    core_batches INT[],
    core_departments VARCHAR[]
);

-- 7. FEE PAYMENTS
CREATE TABLE fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    semester_code VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_ref VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. ENROLLMENTS (With 3-Step Approval)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    offering_id INT REFERENCES course_offerings(id) ON DELETE CASCADE,
    
    -- Approval Status
    status VARCHAR(30) DEFAULT 'pending_instructor', 
    -- 'pending_instructor', 'pending_faculty_advisor', 'enrolled', 'rejected'
    
    -- Course Category
    category VARCHAR(20) CHECK (category IN ('core', 'open_elective', 'minor', 'concentration')),
    
    grade VARCHAR(2),
    
    UNIQUE(student_id, offering_id)
);

CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    semester_code VARCHAR(20) UNIQUE NOT NULL,
    year INT NOT NULL,
    term VARCHAR(20),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true
);

-- 9. SEED ADMIN
INSERT INTO users (name, email, role) 
VALUES ('Dean Academics', 'admin@iitrpr.ac.in', 'admin');