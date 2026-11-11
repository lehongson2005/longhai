const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Categories
router.get('/categories', expenseController.getCategories);

module.exports = router;
