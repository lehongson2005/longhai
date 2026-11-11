const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', scheduleController.getSchedules);
router.post('/', scheduleController.createOrUpdateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
