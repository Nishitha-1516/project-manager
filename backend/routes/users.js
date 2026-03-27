const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/users
// Returns users who share at least one project with the requester.
// Used for task-assignment dropdowns and member-invite selects.
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('owner members');

    const userIdSet = new Set();
    userIdSet.add(String(req.user._id));
    projects.forEach((p) => {
      userIdSet.add(String(p.owner));
      p.members.forEach((m) => userIdSet.add(String(m.user)));
    });

    const users = await User.find({ _id: { $in: [...userIdSet] } }).select(
      'name email avatar role'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/all
// Returns ALL registered users — used only for the "invite new member" flow
// so an admin can find someone who hasn't joined any shared project yet.
router.get('/all', async (req, res) => {
  try {
    const users = await User.find({}).select('name email avatar role');
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
