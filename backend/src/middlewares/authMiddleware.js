import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
};

const authMiddlewareNotReq = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    return next();
  }
};

const isEmployer = (req, res, next) => {
  if (req.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied. You must be an employer to perform this action.' });
  }
  next();
};


const isAdmin = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. You must be an employer to perform this action.' });
  }
  next();
};

const isJobSeeker = (req, res, next) => {
  if (req.role !== 'job_seeker') {
    return res.status(403).json({ message: 'Access denied. You must be an job_seeker to perform this action.' });
  }
  next();
};

export { authMiddleware, authMiddlewareNotReq, isAdmin, isEmployer, isJobSeeker };
