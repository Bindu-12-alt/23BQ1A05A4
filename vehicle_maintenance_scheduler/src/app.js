require('dotenv').config();
const express = require('express');
const initDB = require('./models/schema');
const vehicleRoutes = require('./routes/vehicles');
const scheduleRoutes = require('./routes/schedules');
const startReminderService = require('./services/reminderService');
const requestLogger = require('../../logging_middleware/src/middleware/requestLogger');
const errorLogger = require('../../logging_middleware/src/middleware/errorLogger');

const app = express();
app.use(express.json());
app.use(requestLogger);  // logging middleware integrated

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/schedules', scheduleRoutes);

app.use(errorLogger);  // error logging middleware integrated

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Vehicle scheduler running on port ${PORT}`));

initDB().then(() => {
  startReminderService();
  console.log('Database connected');
}).catch((err) => console.error('DB connection failed (server still running):', err.message));
