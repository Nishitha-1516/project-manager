const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── Helpers ────────────────────────────────────────────────────────────────

function isMember(project, userId) {
  return (
    String(project.owner) === String(userId) ||
    project.members.some((m) => String(m.user) === String(userId))
  );
}

function isAdminOrOwner(project, userId) {
  if (String(project.owner) === String(userId)) return true;
  const m = project.members.find((m) => String(m.user) === String(userId));
  return m?.role === 'admin';
}

const populate = (q) =>
  q
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

// ─── Project CRUD ────────────────────────────────────────────────────────────

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await populate(
      Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).sort('-updatedAt')
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user._id, members: [] });
    await populate(Project.findById(project._id)).then((p) => res.status(201).json(p));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await populate(Project.findById(req.params.id));
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id  (owner or admin can edit metadata)
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdminOrOwner(project, req.user._id))
      return res.status(403).json({ message: 'Only project admins can edit this project' });

    // Prevent overwriting members/owner via body
    const { members, owner, ...safe } = req.body;
    const updated = await populate(
      Project.findByIdAndUpdate(req.params.id, safe, { new: true, runValidators: true })
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id  (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (String(project.owner) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the project owner can delete this project' });

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id))
      return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: req.params.id });
    res.json({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Member Management ───────────────────────────────────────────────────────

// POST /api/projects/:id/members  — add a user (owner or admin)
router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdminOrOwner(project, req.user._id))
      return res.status(403).json({ message: 'Only project admins can add members' });

    const { userId, role = 'member' } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    if (String(project.owner) === String(userId))
      return res.status(400).json({ message: 'User is the project owner' });
    if (project.members.some((m) => String(m.user) === String(userId)))
      return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: userId, role });
    await project.save();
    const updated = await populate(Project.findById(project._id));
    res.status(201).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/projects/:id/members/:userId  — change role (owner only)
router.patch('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (String(project.owner) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the project owner can change roles' });

    const member = project.members.find((m) => String(m.user) === String(req.params.userId));
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ message: 'Role must be admin or member' });

    member.role = role;
    await project.save();
    const updated = await populate(Project.findById(project._id));
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId  — remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isSelf = String(req.params.userId) === String(req.user._id);
    if (!isAdminOrOwner(project, req.user._id) && !isSelf)
      return res.status(403).json({ message: 'Not authorized to remove this member' });

    // Owner cannot be removed
    if (String(project.owner) === String(req.params.userId))
      return res.status(400).json({ message: 'Cannot remove the project owner' });

    project.members = project.members.filter((m) => String(m.user) !== String(req.params.userId));
    await project.save();
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
