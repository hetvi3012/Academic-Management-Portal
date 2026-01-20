import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');  
  // Public endpoints don't need token
  if (config.url.includes('/auth/login') || config.url.includes('/auth/send-otp')) {
    return config; 
  }
  
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => Promise.reject(error));

// --- API CATEGORIES ---

export const authAPI = {
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  login: (email, otp) => api.post('/auth/login', { email, otp }),
  addFaculty: (data) => api.post('/auth/add-faculty', data),
  addStudent: (data) => api.post('/auth/add-student', data),
};

export const adminAPI = {
  // Course Management
  createCourse: (data) => api.post('/admin/courses', data),
  
  // Lists
  getStudents: () => api.get('/admin/students'),
  getFacultyList: () => api.get('/admin/faculty-list'),
  
  // Semester Management
  getSemesters: () => api.get('/admin/semesters'),
  createSemester: (data) => api.post('/admin/semesters', data),
  
  // Advisor Assignment
  assignAdvisor: (data) => api.post('/admin/assign-advisor', data),

  // Approvals
  getPendingOfferings: () => api.get('/admin/offerings/pending'),
  approveOffering: (offeringId, action) => api.post('/admin/offerings/approve', { offeringId, action }),
};

export const academicAPI = {
  // *** FIXED: Renamed 'getCatalog' to 'getCourses' to match your Admin/Faculty pages ***
  getCourses: () => api.get('/academic/courses'), 
  createCourse: (data) => api.post('/academic/courses', data),
};

export const facultyAPI = {
  floatCourse: (data) => api.post('/faculty/float', data),
  getMyOfferings: () => api.get('/faculty/offerings'),
  getInstructorRequests: () => api.get('/faculty/requests/instructor'),
  getCourseStudents: (offeringId) => api.get(`/faculty/course/${offeringId}/students`),
  updateGrade: (data) => api.post('/faculty/grade', data), // { enrollmentId, grade }
  completeCourse: (data) => api.post('/faculty/complete', data),
  handleInstructorAction: (enrollmentId, action) => api.post('/faculty/action/instructor', { enrollmentId, action }),
  getAdvisorRequests: () => api.get('/faculty/requests/advisor'),
  handleAdvisorAction: (enrollmentId, action) => api.post('/faculty/action/advisor', { enrollmentId, action }),
};

export const studentAPI = {
  getOfferings: () => api.get('/student/offerings'),
  getMyCourses: () => api.get('/student/my-courses'),
  payFees: (data) => api.post('/student/pay-fees', data),
  getFeeStatus: () => api.get('/student/fees/status'),
  register: (data) => api.post('/student/register', data),
};

export default api;