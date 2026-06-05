const cron = require('node-cron');
const pool = require('../config/db');

const startReminderService = () => {
  // Runs every day at 8am
  cron.schedule('0 8 * * *', async () => {
    const result = await pool.query(`
      SELECT ms.*, v.owner_name, v.license_plate
      FROM maintenance_schedules ms
      JOIN vehicles v ON v.id = ms.vehicle_id
      WHERE ms.scheduled_date = CURRENT_DATE + INTERVAL '1 day'
      AND ms.status = 'pending'
    `);

    result.rows.forEach((schedule) => {
      console.log(
        `[REMINDER] Vehicle ${schedule.license_plate} (${schedule.owner_name}) ` +
        `has ${schedule.service_type} scheduled tomorrow.`
      );
    });
  });

  console.log('Reminder service started');
};

module.exports = startReminderService;
