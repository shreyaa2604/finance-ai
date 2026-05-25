const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../server');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

beforeEach(() => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, '[]');
});

describe('Expenses API', () => {
  test('adds an expense and retrieves it', async () => {
    const expense = { amount: 12.5, category: 'coffee', note: 'latte' };
    await request(app).post('/api/expenses').send(expense).expect(201).expect('Content-Type', /json/);

    const res = await request(app).get('/api/expenses').expect(200).expect('Content-Type', /json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('coffee');
  });
});
