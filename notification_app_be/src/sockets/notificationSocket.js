const logger = require('../utils/logger');

// map of studentId -> socketId so we can target specific students
const connectedClients = new Map();

const initSocket = (io) => {
  io.on('connection', (socket) => {
    const { studentId } = socket.handshake.query;
    if (studentId) {
      connectedClients.set(String(studentId), socket.id);
      logger.info(`Student ${studentId} connected via socket`);
      console.log(`[debug] active socket connections: ${connectedClients.size}`);
    }

    socket.on('disconnect', () => {
      connectedClients.delete(String(studentId));
      logger.info(`Student ${studentId} disconnected`);
    });
  });
};

const pushToStudent = (io, studentId, data) => {
  const sid = connectedClients.get(String(studentId));
  // only emit if student is currently connected, otherwise they'll get it on next poll
  if (sid) io.to(sid).emit('notification', data);
};

module.exports = { initSocket, pushToStudent };
