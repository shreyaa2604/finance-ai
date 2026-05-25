const express = require('express');
const router = express.Router();

const {
  listExpenses
} = require('../controllers/expenseController');

// This route provides a simple, deterministic "Budget Planner" feature
// that analyzes recorded expenses and returns category totals, shares,
// suggested budgets and a recommended savings suggestion useful for planning.
router.get('/', (req, res) => {
  try {
    const expenses = listExpenses();
    const totalsByCategory = {};
    let total = 0;
    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      const cat = (e.category || 'uncategorized').toLowerCase();
      totalsByCategory[cat] = (totalsByCategory[cat] || 0) + amt;
      total += amt;
    }

    const byCategory = Object.entries(totalsByCategory).map(([category, spent]) => {
      const percent = total > 0 ? (spent / total) : 0;
      // Suggested budget: give a 10% buffer above historic spend
      const suggestedBudget = Number((spent * 1.1).toFixed(2));
      return { category, spent: Number(spent.toFixed ? spent.toFixed(2) : spent), percent: Number((percent * 100).toFixed(1)), suggestedBudget };
    });

    // Simple savings suggestion: recommend 20% of total as baseline savings
    const suggestedSavingsRate = 0.2;
    const suggestedMonthlySavings = Number((total * suggestedSavingsRate).toFixed(2));

    res.json({
      planner: {
        totalSpent: Number(total.toFixed ? total.toFixed(2) : total),
        byCategory,
        suggestedSavingsRate,
        suggestedMonthlySavings,
        note: 'Suggested budgets are a simple heuristic (10% buffer). Adjust as needed.'
      }
    });

  } catch (error) {
    console.error('Planner error:', error);
    res.status(500).json({ error: 'Failed to generate budget plan' });
  }
});

module.exports = router;