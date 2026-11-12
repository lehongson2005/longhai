const express = require('express');
const router = express.Router();
const adjustmentController = require('../controllers/adjustment.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', adjustmentController.getAdjustments);
router.post('/', adjustmentController.createAdjustment);
router.delete('/:id', adjustmentController.deleteAdjustment);

module.exports = router;
