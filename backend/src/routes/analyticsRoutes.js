import express from 'express';
import { getProjectSummary } from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/summary/:projectId').get(protect, getProjectSummary);

export default router;