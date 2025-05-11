const jwt = require('jsonwebtoken');
const axios = require('axios');

// Xác thực token
const verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    try {
      // Xác thực token thông qua Auth Service
      const response = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://localhost:2000'}/api/auth/verify-token`,
        { token }
      );
      
      req.user = response.data.user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

// Kiểm tra quyền người dùng
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
};
