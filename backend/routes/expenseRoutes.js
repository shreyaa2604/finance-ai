const express = require('express');
const router = express.Router();

const {
  addExpense,
  getExpenses,
  deleteExpense
} = require('../controllers/expenseController');

router.post('/', addExpense);

router.get('/', getExpenses);

router.delete('/:index', deleteExpense);

module.exports = router;