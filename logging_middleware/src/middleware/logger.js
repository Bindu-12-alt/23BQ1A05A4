const { createLogger, format, transports } = require('winston');
const path = require('path');

// winston gives structured JSON logs which are easier to parse than plain console.log
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({ format: format.combine(format.colorize(), format.simple()) }),
    // separate error file so we don't have to grep through combined log for issues
    new transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
    new transports.File({ filename: path.join(__dirname, '../../logs/combined.log') })
  ]
});

module.exports = logger;
