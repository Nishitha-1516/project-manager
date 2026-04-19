const express = require('express');
const Project = require('../models/Project');
const Task    = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Helpers ───────────────────────────────────────────────────────────────────

function populateProject(query) {
  return query
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');
}

function isMember(project, userId) {
  const id = String(userId);
  return (
    String(project.owner?._id || project.owner) === id ||
    project.members.some((m) => String(m.user?._id || m.user) === id)
  );
}

function isAdminOrOwner(project, userId) {
  const id = String(userId);
  if (String(project.owner?._id || project.owner) === id) return true;
  return project.members.some(
    (m) => String(m.user?._id || m.user) === id && m.role === 'admin'
  );
}

// Emit to everyone in the project room except the sender
function emit(req, projectId, event, payload) {
  req.io?.to(`project:${projectId}`).emit(event, payload);
}

// ── Project CRUD ──────────────────────────────────────────────────────────────

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await populateProject(
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
    const populated = await populateProject(Project.findById(project._id));
    // No room to broadcast to yet — caller will join after redirect
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await populateProject(Project.findById(req.params.id));
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdminOrOwner(project, req.user._id))
      return res.status(403).json({ message: 'Only admins or the owner can edit this project' });

    const { members, owner, ...safeBody } = req.body;
    Object.assign(project, safeBody);
    await project.save();
    const updated = await populateProject(Project.findById(project._id));

    emit(req, req.params.id, 'project:updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (String(project.owner) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the owner can delete this project' });

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });

    // Notify everyone in the room the project is gone
    emit(req, req.params.id, 'project:deleted', { projectId: req.params.id });
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
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: req.params.id });
    res.json({
      total:      tasks.length,
      todo:       tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      review:     tasks.filter((t) => t.status === 'review').length,
      done:       tasks.filter((t) => t.status === 'done').length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Member management ─────────────────────────────────────────────────────────

// POST /api/projects/:id/members
router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdminOrOwner(project, req.user._id))
      return res.status(403).json({ message: 'Only admins or the owner can add members' });

    const { userId, role = 'member' } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (String(project.owner) === String(userId))
      return res.status(400).json({ message: 'That user is already the project owner' });
    if (project.members.some((m) => String(m.user) === String(userId)))
      return res.status(400).json({ message: 'User is already a member of this project' });

    project.members.push({ user: userId, role });
    await project.save();
    const updated = await populateProject(Project.findById(project._id));

    emit(req, req.params.id, 'project:members_updated', updated);
    res.status(201).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/projects/:id/members/:userId
router.patch('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (String(project.owner) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the owner can change member roles' });

    const member = project.members.find((m) => String(m.user) === String(req.params.userId));
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (!['admin', 'member'].includes(req.body.role))
      return res.status(400).json({ message: 'role must be admin or member' });

    member.role = req.body.role;
    await project.save();
    const updated = await populateProject(Project.findById(project._id));

    emit(req, req.params.id, 'project:members_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isSelf = String(req.params.userId) === String(req.user._id);
    if (!isAdminOrOwner(project, req.user._id) && !isSelf)
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    if (String(project.owner) === String(req.params.userId))
      return res.status(400).json({ message: 'Cannot remove the project owner' });

    project.members = project.members.filter(
      (m) => String(m.user) !== String(req.params.userId)
    );
    await project.save();

    emit(req, req.params.id, 'project:members_updated', {
      projectId: req.params.id,
      removedUserId: req.params.userId,
      members: project.members,
    });
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
