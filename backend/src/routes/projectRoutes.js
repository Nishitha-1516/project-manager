import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
} from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createProject).get(protect, getProjects);
router.route('/:id').get(protect, getProjectById);

export default router;