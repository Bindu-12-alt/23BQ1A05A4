const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

const createVehicle = async (req, res) => {
  const { owner_name, license_plate, make, model, year } = req.body;
  const vehicleId = uuidv4();
  console.log(`[debug] creating vehicle: ${license_plate}`);
  const result = await pool.query(
    `INSERT INTO vehicles (id, owner_name, license_plate, make, model, year)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [vehicleId, owner_name, license_plate, make, model, year]
  );
  res.status(201).json(result.rows[0]);
};

const getVehicles = async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
  res.json(result.rows);
};

const getVehicle = async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(result.rows[0]);
};

const updateVehicle = async (req, res) => {
  const { owner_name, license_plate, make, model, year } = req.body;
  const result = await pool.query(
    `UPDATE vehicles SET owner_name=$1, license_plate=$2, make=$3, model=$4, year=$5
     WHERE id=$6 RETURNING *`,
    [owner_name, license_plate, make, model, year, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(result.rows[0]);
};

const deleteVehicle = async (req, res) => {
  const result = await pool.query('DELETE FROM vehicles WHERE id=$1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ status: 'deleted' });
};

module.exports = { createVehicle, getVehicles, getVehicle, updateVehicle, deleteVehicle };

const getVehicles = async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
  res.json(result.rows);
};

const getVehicle = async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(result.rows[0]);
};

const updateVehicle = async (req, res) => {
  const { owner_name, license_plate, make, model, year } = req.body;
  const result = await pool.query(
    `UPDATE vehicles SET owner_name=$1, license_plate=$2, make=$3, model=$4, year=$5
     WHERE id=$6 RETURNING *`,
    [owner_name, license_plate, make, model, year, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(result.rows[0]);
};

const deleteVehicle = async (req, res) => {
  const result = await pool.query('DELETE FROM vehicles WHERE id=$1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ status: 'deleted' });
};

module.exports = { createVehicle, getVehicles, getVehicle, updateVehicle, deleteVehicle };
