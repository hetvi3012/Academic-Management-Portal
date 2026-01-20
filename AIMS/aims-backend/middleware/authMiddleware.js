const jwt = require('jsonwebtoken');
require('dotenv').config();
//high order function is used
module.exports = (roles = []) => {
  return (req, res, next) => {
    // 1. Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user from payload to request object
      req.user = decoded; 

      // 3. Check Role (if roles are specified)
      // Example: If route requires ['admin'] and user is 'student' -> Fail
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
      }

      next();
    } catch (err) {
      res.status(401).json({ error: 'Token is not valid' });
    }
  };
};