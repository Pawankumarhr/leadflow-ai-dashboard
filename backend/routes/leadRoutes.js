const express = require('express');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const { createLeadSchema, updateLeadSchema, noteSchema } = require('../validation/leadSchemas');
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
  addNote,
  deleteNote,
} = require('../controllers/leadController');

const router = express.Router();

router.use(auth);

router.post('/', validate(createLeadSchema), createLead);
router.get('/', getLeads);
router.get('/export', exportLeads);
router.get('/:id', getLeadById);
router.patch('/:id', validate(updateLeadSchema), updateLead);
router.post('/:id/notes', validate(noteSchema), addNote);
router.delete('/:id/notes/:noteId', deleteNote);
router.delete('/:id', roles(['admin']), deleteLead);

module.exports = router;
