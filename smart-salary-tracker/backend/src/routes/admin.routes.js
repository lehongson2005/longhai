const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');

router.use(authMiddleware, requireAdmin);

router.get('/stats', adminController.getStats);

router.get('/jobs', adminController.getAllJobs);
router.post('/jobs', adminController.createJob);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);

router.get('/applications', adminController.getApplications);
router.patch('/applications/:id', adminController.updateApplicationStatus);

router.get('/quotes', adminController.getQuotes);
router.patch('/quotes/:id', adminController.updateQuoteStatus);

module.exports = router;
