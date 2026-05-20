import express from 'express';
import auth from '../middleware/auth';
import roles from '../middleware/roles';
import { listAuditLogs } from '../controllers/auditController';

const router = express.Router();

router.use(auth, roles(['admin']));
router.get('/', listAuditLogs);

export default router;
