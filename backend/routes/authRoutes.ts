import express from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { bootstrapAdmin } from '../controllers/bootstrapController';
import validate from '../middleware/validate';
import { registerSchema, loginSchema } from '../validation/authSchemas';
import { refreshSchema } from '../validation/userSchemas';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/bootstrap', validate(registerSchema), bootstrapAdmin);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', validate(refreshSchema), logout);

export default router;
