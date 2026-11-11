const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/jobs', publicController.getJobs);
router.get('/jobs/:id', publicController.getJobById);
router.post('/applications', publicController.createApplication);
router.post('/quotes', publicController.createQuoteRequest);
router.post('/salary-estimate', publicController.estimateSalary);

module.exports = router;
