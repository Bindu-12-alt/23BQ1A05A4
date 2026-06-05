const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
