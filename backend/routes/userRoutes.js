const express = require('express');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, savePresetSchema } = require('../validation/userSchemas');
const {
	listUsers,
	createUser,
	updateUser,
	deleteUser,
	listPresets,
	savePreset,
	deletePreset,
} = require('../controllers/userController');

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

module.exports = router;
