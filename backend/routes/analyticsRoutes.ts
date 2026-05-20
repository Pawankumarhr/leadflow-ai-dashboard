import express from 'express';
import auth from '../middleware/auth';
import { listAnalytics } from '../controllers/analyticsController';

const router = express.Router();

router.use(auth);
router.get('/', listAnalytics);

export default router;
