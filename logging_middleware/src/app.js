require('dotenv').config();
const express = require('express');
const requestLogger = require('./middleware/requestLogger');
const errorLogger = require('./middleware/errorLogger');
const routes = require('./routes/index');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/api', routes);
app.use(errorLogger);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Logging middleware server running on port ${PORT}`));

module.exports = app;
