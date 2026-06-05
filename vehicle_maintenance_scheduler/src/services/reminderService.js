const cron = require('node-cron');
const pool = require('../config/db');

const startReminderService = () => {
  // fires every morning at 8am — gives owner enough time to prepare for next-day service
  cron.schedule('0 8 * * *', async () => {
    const res = await pool.query(`
      SELECT ms.*, v.owner_name, v.license_plate
      FROM maintenance_schedules ms
      JOIN vehicles v ON v.id = ms.vehicle_id
      WHERE ms.scheduled_date = CURRENT_DATE + INTERVAL '1 day'
      AND ms.status = 'pending'
    `);

    if (res.rows.length === 0) {
      console.log('[reminder] no upcoming maintenance tomorrow');
      return;
    }

    res.rows.forEach((schedule) => {
      console.log(
        `[REMINDER] Vehicle ${schedule.license_plate} (${schedule.owner_name}) ` +
        `has ${schedule.service_type} scheduled tomorrow.`
      );
    });
  });

  console.log('Reminder service started');
};

module.exports = startReminderService;
