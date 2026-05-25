// finance-ai-agent/backend/server.js
require('dotenv').config();
const insightRoutes = require('./routes/insightRoutes');
const reportRoutes = require('./routes/reportRoutes');
const express = require('express');
const cors = require('cors');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Finance AI Backend Running');
});

// API Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/planner', insightRoutes);
app.use('/api/report', reportRoutes);

// Start the server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

