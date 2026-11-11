const jwt = require('jsonwebtoken');
const { dbGet } = require('../database/db');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        const user = await dbGet('SELECT id, role FROM users WHERE id = ?', [req.userId]);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin permission required' });
        }
        req.userRole = user.role;
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { authMiddleware, requireAdmin };
