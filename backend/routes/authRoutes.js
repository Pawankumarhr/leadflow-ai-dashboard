const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');
const { bootstrapAdmin } = require('../controllers/bootstrapController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/authSchemas');
const { refreshSchema } = require('../validation/userSchemas');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/bootstrap', validate(registerSchema), bootstrapAdmin);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', validate(refreshSchema), logout);

module.exports = router;
