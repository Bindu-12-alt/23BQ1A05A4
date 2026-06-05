const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/error-test', (req, res, next) => {
  next(new Error('Test error for logging'));
});

module.exports = router;
