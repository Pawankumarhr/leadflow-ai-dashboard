const User = require('../models/User');

const bootstrapAdmin = async (req, res) => {
  const bootstrapToken = process.env.BOOTSTRAP_TOKEN;
  const requestToken = req.headers['x-bootstrap-token'];

  if (!bootstrapToken) {
    return res.status(400).json({ message: 'Bootstrap token not configured' });
  }

  if (!requestToken || requestToken !== bootstrapToken) {
    return res.status(401).json({ message: 'Invalid bootstrap token' });
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(409).json({ message: 'Admin already exists' });
  }

  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: 'admin',
  });

  return res.status(201).json({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
};

module.exports = {
  bootstrapAdmin,
};
