const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/users
// Returns users who share at least one project with the requester.
// Also supports ?search=name to find users to invite (returns broader results for owners/admins).
router.get('/', async (req, res) => {
  try {
    // Find all projects the current user belongs to
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('owner members');

    // Collect every collaborator ID
    const userIdSet = new Set();
    userIdSet.add(String(req.user._id));
    projects.forEach((p) => {
      userIdSet.add(String(p.owner));
      (p.members || []).forEach((m) => userIdSet.add(String(m.user)));
    });

    // If ?search= is provided (used by the "add member" flow), also search by name/email
    // across all users so project owners can invite people not yet on any shared project.
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      const searchResults = await User.find({
        $or: [{ name: regex }, { email: regex }],
      }).select('name email avatar role');
      return res.json(searchResults);
    }

    const users = await User.find({ _id: { $in: [...userIdSet] } }).select(
      'name email avatar role'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile — update own profile
router.put('/profile', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
