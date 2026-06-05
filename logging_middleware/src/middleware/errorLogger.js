const logger = require('./logger');

const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    status: err.status || 500
  });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
};

module.exports = errorLogger;
