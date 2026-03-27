const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['planning', 'active', 'on-hold', 'completed'],
      default: 'planning',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    color: { type: String, default: '#6366f1' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date },
    startDate: { type: Date, default: Date.now },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Virtual: task count (populated separately)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

module.exports = mongoose.model('Project', projectSchema);
