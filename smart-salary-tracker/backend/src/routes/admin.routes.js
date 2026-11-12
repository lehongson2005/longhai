const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

router.use(authMiddleware, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
