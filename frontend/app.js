const API_BASE = 'http://127.0.0.1:8000';

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadExpenses() {
  try {
    const data = await fetchJSON(`${API_BASE}/api/expenses`);
    renderExpenses(data);
  } catch (err) {
    console.error(err);
    renderExpenses([]);
  }
}

function renderExpenses(items) {
  const ul = document.getElementById('expenses-list');
  ul.innerHTML = '';
  if (!items.length) {
    ul.innerHTML = '<li>No expenses yet.</li>';
    renderChart([]);
    return;
  }
  for (const i in items) {
    const e = items[i];
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.innerHTML = `<span>${e.category || 'uncategorized'} — $${Number(e.amount || 0).toFixed(2)} ${e.note ? '- ' + e.note : ''}</span>
                     <button class="delete-btn" data-index="${i}" title="Delete">✕</button>`;
    li.querySelector('.delete-btn').addEventListener('click', (ev) => deleteExpense(ev, i));
    ul.appendChild(li);
  }
  renderChart(items);
}

async function deleteExpense(ev, index) {
  ev.preventDefault();
  if (!confirm('Delete this expense?')) return;
  try {
    await fetch(`${API_BASE}/api/expenses/${index}`, { method: 'DELETE' });
    loadExpenses();
    document.getElementById('status').textContent = 'Expense deleted.';
    setTimeout(() => (document.getElementById('status').textContent = ''), 2000);
  } catch (err) {
    document.getElementById('status').textContent = 'Failed to delete: ' + err.message;
  }
}

function renderChart(items) {
  try {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;

    const totals = {};
    for (const e of items) {
      const amt = Number(e.amount) || 0;
      const cat = (e.category || 'uncategorized');
      totals[cat] = (totals[cat] || 0) + amt;
    }

    const labels = Object.keys(totals);
    const data = labels.map(l => Number(totals[l].toFixed ? totals[l].toFixed(2) : totals[l]));

    // create or update chart
    if (!window.expensesChart) {
      window.expensesChart = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data, backgroundColor: labels.map((_, i) => `hsl(${(i*60)%360} 70% 50%)`) }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    } else {
      window.expensesChart.data.labels = labels;
      window.expensesChart.data.datasets[0].data = data;
      window.expensesChart.update();
    }
  } catch (err) {
    console.error('Chart render error:', err);
  }
}

async function addExpense(ev) {
  ev.preventDefault();
  const form = ev.target;
  const addBtn = document.getElementById('add-expense-btn');
  addBtn.disabled = true;
  const status = document.getElementById('status');
  
  // store salary in localStorage
  const salary = parseFloat(form.salary.value);
  if (salary && salary > 0) {
    localStorage.setItem('monthlySalary', salary);
  }
  
  const data = {
    amount: parseFloat(form.amount.value),
    category: form.category.value.trim(),
    note: form.note.value.trim()
  };
  if (!data.category || !data.amount || Number.isNaN(data.amount) || data.amount <= 0) {
    status.textContent = 'Please provide a valid category and amount.';
    addBtn.disabled = false;
    return;
  }
  try {
    await fetchJSON(`${API_BASE}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    form.reset();
    status.textContent = 'Expense added.';
    loadExpenses();
    setTimeout(() => (status.textContent = ''), 2000);
  } catch (err) {
    status.textContent = 'Failed to add expense: ' + err.message;
  } finally {
    addBtn.disabled = false;
  }
}

async function generatePlan() {
  const out = document.getElementById('plan-output');
  const btn = document.getElementById('get-plan');
  btn.disabled = true;
  out.innerHTML = '<em>Generating plan...</em>';
  try {
    const res = await fetchJSON(`${API_BASE}/api/planner`);
    renderPlanner(res.planner || res);
  } catch (err) {
    out.innerHTML = '<div class="planner-error">Failed to generate plan: ' + err.message + '</div>';
  } finally {
    btn.disabled = false;
  }
}

function renderPlanner(planner) {
  const out = document.getElementById('plan-output');
  if (!planner) {
    out.innerHTML = '<div class="planner-empty">No plan available.</div>';
    return;
  }

  const total = planner.totalSpent ?? 0;
  const savings = planner.suggestedMonthlySavings ?? 0;
  const rate = (planner.suggestedSavingsRate ?? 0) * 100;

  const card = document.createElement('div');
  card.className = 'planner-summary';

  card.innerHTML = `
    <div class="planner-top">
      <div class="planner-total">Total Spent: <strong>$${Number(total).toFixed(2)}</strong></div>
      <div class="planner-savings">Suggested Savings: <strong>$${Number(savings).toFixed(2)}</strong> (${Number(rate).toFixed(0)}%)</div>
    </div>
    <div class="planner-cats"></div>
    <div class="planner-note">${planner.note || ''}</div>
  `;

  const catsEl = card.querySelector('.planner-cats');
  if (Array.isArray(planner.byCategory) && planner.byCategory.length) {
    const list = document.createElement('div');
    list.className = 'category-list';
    planner.byCategory.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'category-item';
      const color = `hsl(${(i*60)%360} 70% 50%)`;
      item.innerHTML = `<span class="chip" style="background:${color}" title="${c.percent}% of spending"></span>
                        <div class="cat-meta">
                          <div class="cat-name">${escapeHtml(c.category)}</div>
                          <div class="cat-values">$${Number(c.spent).toFixed(2)} • ${Number(c.percent).toFixed(1)}%</div>
                        </div>
                        <div class="cat-budget">Suggested: $${Number(c.suggestedBudget).toFixed(2)}</div>`;
      list.appendChild(item);
    });
    catsEl.appendChild(list);
  } else {
    catsEl.innerHTML = '<div class="planner-empty">No categories yet.</div>';
  }

  out.innerHTML = '';
  out.appendChild(card);

  // update chart colors and labels to match
  if (window.expensesChart) {
    const labels = planner.byCategory.map(c => c.category);
    const data = planner.byCategory.map(c => c.spent);
    const colors = planner.byCategory.map((_, i) => `hsl(${(i*60)%360} 70% 50%)`);
    window.expensesChart.data.labels = labels;
    window.expensesChart.data.datasets[0].data = data;
    window.expensesChart.data.datasets[0].backgroundColor = colors;
    window.expensesChart.update();
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
}

document.getElementById('expense-form').addEventListener('submit', addExpense);
document.getElementById('get-plan').addEventListener('click', generatePlan);
document.getElementById('get-report').addEventListener('click', generateReport);

async function generateReport() {
  const out = document.getElementById('report-output');
  const btn = document.getElementById('get-report');
  btn.disabled = true;
  out.innerHTML = '<em>Generating report...</em>';
  try {
    const salary = localStorage.getItem('monthlySalary') || 0;
    const res = await fetchJSON(`${API_BASE}/api/report?salary=${salary}`);
    renderReport(res.report || res);
  } catch (err) {
    out.innerHTML = '<div class="report-error">Failed to generate report: ' + err.message + '</div>';
  } finally {
    btn.disabled = false;
  }
}

function renderReport(report) {
  const out = document.getElementById('report-output');
  if (!report) {
    out.innerHTML = '<div class="report-empty">No data available.</div>';
    return;
  }

  const salary = report.salary || 0;
  const totalSpent = report.totalSpent || 0;
  const canSave = report.canSave || 0;
  const savingsRate = report.savingsRate || 0;

  const card = document.createElement('div');
  card.className = 'report-summary';

  card.innerHTML = `
    <div class="report-header">
      <div class="report-item">
        <strong>Monthly Salary:</strong> $${Number(salary).toFixed(2)}
      </div>
      <div class="report-item">
        <strong>Total Spent:</strong> $${Number(totalSpent).toFixed(2)}
      </div>
      <div class="report-item highlight">
        <strong>Can Save:</strong> $${Number(canSave).toFixed(2)} (${Number(savingsRate).toFixed(1)}%)
      </div>
    </div>
    <div class="report-breakdown"></div>
    <div class="report-recommendations"></div>
  `;

  const breakdownEl = card.querySelector('.report-breakdown');
  if (Array.isArray(report.byCategory) && report.byCategory.length) {
    breakdownEl.innerHTML = '<h4>Spending by Category</h4>';
    const list = document.createElement('div');
    list.className = 'breakdown-list';
    report.byCategory.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      const color = `hsl(${(i*60)%360} 70% 50%)`;
      item.innerHTML = `
        <span class="chip" style="background:${color}"></span>
        <div class="breakdown-meta">
          <div class="cat-name">${escapeHtml(c.category)}</div>
          <div class="cat-stats">$${Number(c.spent).toFixed(2)} (${Number(c.percent).toFixed(1)}% of income)</div>
        </div>
      `;
      list.appendChild(item);
    });
    breakdownEl.appendChild(list);
  }

  const recEl = card.querySelector('.report-recommendations');
  if (report.recommendations && report.recommendations.length) {
    recEl.innerHTML = '<h4>Recommendations</h4><ul class="rec-list">' + report.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('') + '</ul>';
  }

  out.innerHTML = '';
  out.appendChild(card);
}

loadExpenses();
