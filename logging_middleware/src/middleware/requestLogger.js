const morgan = require('morgan');
const logger = require('./logger');

// pipe morgan output into winston so everything goes to the same log files
const stream = { write: (msg) => logger.info(msg.trim()) };

const requestLogger = morgan(
  (tokens, req, res) => JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res)),
    responseTime: `${tokens['response-time'](req, res)}ms`,
    contentLength: tokens.res(req, res, 'content-length'),
    userAgent: tokens['user-agent'](req, res)
  }),
  { stream }
);

module.exports = requestLogger;
