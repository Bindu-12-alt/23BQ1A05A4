const express = require('express');
const router = express.Router();
const { createVehicle, getVehicles, getVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { validate, vehicleSchema } = require('../middleware/validate');

router.post('/', validate(vehicleSchema), createVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.put('/:id', validate(vehicleSchema), updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
