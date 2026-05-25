const express = require('express');
const router = express.Router();

const {
  listExpenses
} = require('../controllers/expenseController');

router.get('/', (req, res) => {
  try {
    const salary = parseFloat(req.query.salary) || 0;
    const expenses = listExpenses();
    
    const totalsByCategory = {};
    let total = 0;
    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      const cat = (e.category || 'uncategorized').toLowerCase();
      totalsByCategory[cat] = (totalsByCategory[cat] || 0) + amt;
      total += amt;
    }

    const canSave = Math.max(0, salary - total);
    const savingsRate = salary > 0 ? (canSave / salary) * 100 : 0;

    const byCategory = Object.entries(totalsByCategory).map(([category, spent]) => {
      const percent = salary > 0 ? (spent / salary) * 100 : 0;
      return { 
        category, 
        spent: Number(spent.toFixed(2)), 
        percent: Number(percent.toFixed(1))
      };
    }).sort((a, b) => b.spent - a.spent);

    // generate recommendations
    const recommendations = [];
    if (salary === 0) {
      recommendations.push('Please add your monthly salary to get personalized recommendations.');
    } else {
      if (savingsRate < 10) {
        recommendations.push(`You are saving only ${Number(savingsRate).toFixed(1)}% of income. Consider reducing expenses to reach 20% savings goal.`);
      } else if (savingsRate >= 20) {
        recommendations.push(`Great! You are saving ${Number(savingsRate).toFixed(1)}% of income. Keep it up!`);
      }
      
      // category-specific recommendations
      byCategory.forEach(c => {
        if (c.percent > 30) {
          recommendations.push(`${c.category} spending is ${Number(c.percent).toFixed(1)}% of income. Consider reducing it.`);
        }
      });
    }

    res.json({
      report: {
        salary: Number(salary.toFixed(2)),
        totalSpent: Number(total.toFixed(2)),
        canSave: Number(canSave.toFixed(2)),
        savingsRate: Number(savingsRate.toFixed(1)),
        byCategory,
        recommendations
      }
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
