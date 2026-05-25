const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

let expenses = [];

function loadExpensesFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      expenses = JSON.parse(raw);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
    }
  } catch (err) {
    console.error('Failed to load expenses from disk:', err);
    expenses = [];
  }
}

function saveExpensesToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
  } catch (err) {
    console.error('Failed to save expenses to disk:', err);
  }
}

loadExpensesFromDisk();

const addExpense = (req, res) => {
  const expense = req.body;
  // ensure we have the latest from disk before mutating
  loadExpensesFromDisk();
  expenses.push(expense);
  saveExpensesToDisk();
  res.status(201).json(expense);
};

const getExpenses = (req, res) => {
  // reload from disk to ensure tests and concurrent callers see latest data
  loadExpensesFromDisk();
  res.json(expenses);
};

const deleteExpense = (req, res) => {
  loadExpensesFromDisk();
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= expenses.length) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  expenses.splice(index, 1);
  saveExpensesToDisk();
  res.json({ success: true });
};

function listExpenses() {
  // always read fresh data
  loadExpensesFromDisk();
  return expenses;
}

module.exports = {
  addExpense,
  getExpenses,
  deleteExpense,
  listExpenses
};