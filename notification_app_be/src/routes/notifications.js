const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate, notificationSchema } = require('../middleware/validate');
const ctrl = require('../controllers/notificationController');

router.post('/notifications', auth, validate(notificationSchema), ctrl.createNotification);
router.get('/students/:studentId/notifications', auth, ctrl.getNotifications);
router.patch('/notifications/:id/read', auth, ctrl.markRead);
router.get('/students/:studentId/unread-count', auth, ctrl.getUnreadCount);
router.delete('/notifications/:id', auth, ctrl.deleteNotification);
router.get('/priority-inbox', auth, ctrl.priorityInbox);

module.exports = router;
