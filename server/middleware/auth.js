/**
 * Authentication & Role-Based Access Control (RBAC) Middleware
 * Enforces strict JWT verification and Admin privileges.
 */

import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'lapkart_super_secure_jwt_secret_2026_x89312';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role // 'admin' | 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token is required.',
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired authentication token.',
      code: 'INVALID_TOKEN'
    });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireAdmin(req, res, next) {
  // First verify token
  verifyToken(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Administrator privileges are required to access this resource.',
        code: 'ACCESS_DENIED'
      });
    }
    next();
  });
}
