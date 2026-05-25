const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../server');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

beforeEach(() => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { amount: 10, category: 'food' },
    { amount: 20, category: 'transport' }
  ]));
});

describe('Insights API', () => {
  test('returns an insight string', async () => {
    const res = await request(app).get('/api/planner').expect(200).expect('Content-Type', /json/);
    expect(res.body).toHaveProperty('planner');
    expect(typeof res.body.planner).toBe('object');
  });
});
