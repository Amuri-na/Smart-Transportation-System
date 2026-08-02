const express = require('express');
const { findOrCreateUser, isValidEthiopianPhone } = require('../store');

const router = express.Router();

// POST /users/register  { role, name, phone }
// phone must be a valid Ethiopian number in international format:
// +251 9XXXXXXXX (Ethio Telecom) or +251 7XXXXXXXX (Safaricom Ethiopia)
router.post('/register', (req, res) => {
  const { role, name, phone } = req.body;

  if (!role || !name || !phone) {
    return res.status(400).json({ error: 'role, name, and phone are required' });
  }
  if (!['driver', 'passenger'].includes(role)) {
    return res.status(400).json({ error: "role must be 'driver' or 'passenger'" });
  }
  if (!isValidEthiopianPhone(phone)) {
    return res.status(400).json({
      error:
        'Enter a valid Ethiopian number starting with +251 (Ethio Telecom: +2519XXXXXXXX, Safaricom Ethiopia: +2517XXXXXXXX)',
    });
  }

  const user = findOrCreateUser({ role, name, phone });
  res.json(user);
});

module.exports = router;
