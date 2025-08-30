import express from 'express';
import {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createTask);
router.route('/project/:projectId').get(protect, getTasksByProject);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);

export default router;