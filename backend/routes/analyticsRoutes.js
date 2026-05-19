const express = require('express');
const auth = require('../middleware/auth');
const { listAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(auth);
router.get('/', listAnalytics);

module.exports = router;
