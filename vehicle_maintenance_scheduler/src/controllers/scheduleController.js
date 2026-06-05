const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const createSchedule = async (req, res) => {
  const { vehicle_id, service_type, scheduled_date, notes, status } = req.body;
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO maintenance_schedules (id, vehicle_id, service_type, scheduled_date, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, vehicle_id, service_type, scheduled_date, notes, status || 'pending']
  );
  res.status(201).json(result.rows[0]);
};

const getSchedules = async (req, res) => {
  const result = await pool.query(
    `SELECT ms.*, v.license_plate, v.make, v.model
     FROM maintenance_schedules ms
     JOIN vehicles v ON v.id = ms.vehicle_id
     ORDER BY ms.scheduled_date ASC`
  );
  res.json(result.rows);
};

const getSchedulesByVehicle = async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM maintenance_schedules WHERE vehicle_id=$1 ORDER BY scheduled_date ASC`,
    [req.params.vehicleId]
  );
  res.json(result.rows);
};

const updateSchedule = async (req, res) => {
  const { service_type, scheduled_date, notes, status } = req.body;
  const result = await pool.query(
    `UPDATE maintenance_schedules SET service_type=$1, scheduled_date=$2, notes=$3, status=$4
     WHERE id=$5 RETURNING *`,
    [service_type, scheduled_date, notes, status, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Schedule not found' });
  res.json(result.rows[0]);
};

const deleteSchedule = async (req, res) => {
  const result = await pool.query(
    'DELETE FROM maintenance_schedules WHERE id=$1 RETURNING id', [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ status: 'deleted' });
};

module.exports = { createSchedule, getSchedules, getSchedulesByVehicle, updateSchedule, deleteSchedule };
