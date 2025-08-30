import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    index: true 
  },
  description: { type: String },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  project: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;