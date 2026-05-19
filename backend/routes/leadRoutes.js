const express = require('express');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const { createLeadSchema, updateLeadSchema } = require('../validation/leadSchemas');
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
} = require('../controllers/leadController');

const router = express.Router();

router.use(auth);

router.post('/', validate(createLeadSchema), createLead);
router.get('/', getLeads);
router.get('/export', exportLeads);
router.get('/:id', getLeadById);
router.patch('/:id', validate(updateLeadSchema), updateLead);
router.delete('/:id', roles(['admin']), deleteLead);

module.exports = router;
