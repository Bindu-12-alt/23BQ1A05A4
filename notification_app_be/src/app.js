require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const requestLogger = require('../../logging_middleware/src/middleware/requestLogger');
const errorLogger = require('../../logging_middleware/src/middleware/errorLogger');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);  // logging middleware integrated
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'notification_app_be' }));

app.use('/api/v1', notificationRoutes);

app.use(errorLogger);  // error logging middleware integrated

module.exports = app;
