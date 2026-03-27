const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    comments: [commentSchema],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
