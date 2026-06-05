const Joi = require('joi');

const vehicleSchema = Joi.object({
  owner_name: Joi.string().required(),
  license_plate: Joi.string().required(),
  make: Joi.string(),
  model: Joi.string(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear())
});

const scheduleSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  service_type: Joi.string().required(),
  scheduled_date: Joi.date().required(),
  notes: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'completed', 'cancelled')
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validate, vehicleSchema, scheduleSchema };
