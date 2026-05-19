require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (before DB connection)
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Placeholder routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working' });
});

// Start server and connect to DB
const PORT = process.env.PORT || 5000;

console.log('Connecting to MongoDB...');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.log('❌ MongoDB connection failed:', err.message);
  });

module.exports = app;
