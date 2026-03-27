const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort('-updatedAt');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user._id });
    await project.populate('owner', 'name email avatar');
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found or not authorized' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found or not authorized' });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    // Verify the requesting user is owner or member
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    });
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: req.params.id });
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
