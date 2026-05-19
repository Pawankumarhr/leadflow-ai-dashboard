const express = require('express');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { listAuditLogs } = require('../controllers/auditController');

const router = express.Router();

router.use(auth, roles(['admin']));
router.get('/', listAuditLogs);

module.exports = router;
