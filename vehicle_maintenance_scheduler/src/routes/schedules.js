const express = require('express');
const router = express.Router();
const { createSchedule, getSchedules, getSchedulesByVehicle, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { validate, scheduleSchema } = require('../middleware/validate');

router.post('/', validate(scheduleSchema), createSchedule);
router.get('/', getSchedules);
router.get('/vehicle/:vehicleId', getSchedulesByVehicle);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

module.exports = router;
