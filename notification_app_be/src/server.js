const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const sequelize = require('./config/db');
const { initSocket } = require('./sockets/notificationSocket');
const logger = require('./utils/logger');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

initSocket(io);
app.locals.io = io;

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

sequelize.sync({ alter: true })
  .then(() => logger.info('Database synced'))
  .catch((err) => logger.error('DB connection failed (server still running):', err.message));
