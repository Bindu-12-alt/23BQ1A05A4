const Joi = require('joi');

const notificationSchema = Joi.object({
  type: Joi.string().valid('Placement', 'Result', 'Event').required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  targetAudience: Joi.alternatives().try(Joi.string().equal('all'), Joi.number()).required()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validate, notificationSchema };
