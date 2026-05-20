import express from 'express';
import auth from '../middleware/auth';
import roles from '../middleware/roles';
import validate from '../middleware/validate';
import { createLeadSchema, updateLeadSchema, noteSchema } from '../validation/leadSchemas';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
  addNote,
  deleteNote,
} from '../controllers/leadController';

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

export default router;
