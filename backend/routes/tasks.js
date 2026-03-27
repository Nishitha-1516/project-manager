const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserProjectIds(userId) {
  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).select('_id');
  return projects.map((p) => p._id);
}

async function userCanAccessProject(userId, projectId) {
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { 'members.user': userId }],
  });
  return !!project;
}

async function userCanAccessTask(userId, taskId) {
  const task = await Task.findById(taskId).select('project reporter assignee');
  if (!task) return { task: null, allowed: false };
  const allowed = await userCanAccessProject(userId, task.project);
  return { task, allowed };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/tasks?project=id&status=&assignee=&priority=&mine=true
router.get('/', async (req, res) => {
  try {
    let projectIds;

    if (req.query.project) {
      const allowed = await userCanAccessProject(req.user._id, req.query.project);
      if (!allowed) return res.status(403).json({ message: 'Access denied to this project' });
      projectIds = [req.query.project];
    } else {
      projectIds = await getUserProjectIds(req.user._id);
    }

    const filter = { project: { $in: projectIds } };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    if (req.query.mine === 'true') {
      filter.$or = [{ assignee: req.user._id }, { reporter: req.user._id }];
    } else if (req.query.assignee) {
      filter.assignee = req.query.assignee;
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('comments.author', 'name avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    if (!req.body.project) return res.status(400).json({ message: 'project is required' });
    const allowed = await userCanAccessProject(req.user._id, req.body.project);
    if (!allowed) return res.status(403).json({ message: 'Access denied to this project' });

    const task = await Task.create({ ...req.body, reporter: req.user._id });
    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'reporter', select: 'name email avatar' },
    ]);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const { task, allowed } = await userCanAccessTask(req.user._id, req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    await task.populate([
      { path: 'assignee', select: 'name email avatar' },
      { path: 'reporter', select: 'name email avatar' },
      { path: 'comments.author', select: 'name avatar' },
    ]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { task, allowed } = await userCanAccessTask(req.user._id, req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('comments.author', 'name avatar');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { task, allowed } = await userCanAccessTask(req.user._id, req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const { task, allowed } = await userCanAccessTask(req.user._id, req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    task.comments.push({ author: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.author', 'name avatar');
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { task, allowed } = await userCanAccessTask(req.user._id, req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('assignee', 'name email avatar');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
