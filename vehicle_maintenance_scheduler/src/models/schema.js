const pool = require('../config/db');

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY,
      owner_name VARCHAR(100) NOT NULL,
      license_plate VARCHAR(20) UNIQUE NOT NULL,
      make VARCHAR(50),
      model VARCHAR(50),
      year INT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id UUID PRIMARY KEY,
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
      service_type VARCHAR(100) NOT NULL,
      scheduled_date DATE NOT NULL,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Vehicle DB initialized');
};

module.exports = initDB;
