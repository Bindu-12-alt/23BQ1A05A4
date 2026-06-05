const logger = require('../utils/logger');

const clients = new Map();

const initSocket = (io) => {
  io.on('connection', (socket) => {
    const { studentId } = socket.handshake.query;
    if (studentId) {
      clients.set(String(studentId), socket.id);
      logger.info(`Student ${studentId} connected via socket`);
    }

    socket.on('disconnect', () => {
      clients.delete(String(studentId));
      logger.info(`Student ${studentId} disconnected`);
    });
  });
};

const pushToStudent = (io, studentId, data) => {
  const socketId = clients.get(String(studentId));
  if (socketId) io.to(socketId).emit('notification', data);
};

module.exports = { initSocket, pushToStudent };
