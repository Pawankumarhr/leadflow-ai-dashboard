import express from 'express';
import auth from '../middleware/auth';
import roles from '../middleware/roles';
import validate from '../middleware/validate';
import { createUserSchema, updateUserSchema, savePresetSchema } from '../validation/userSchemas';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listPresets,
  savePreset,
  deletePreset,
} from '../controllers/userController';

const router = express.Router();

router.use(auth);

router.get('/presets', listPresets);
router.post('/presets', validate(savePresetSchema), savePreset);
router.delete('/presets/:name', deletePreset);

router.use(roles(['admin']));

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
