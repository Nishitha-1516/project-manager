import Task from '../models/Task.js';
import Project from '../models/Project.js';

export const createTask = async (req, res) => {
  const { title, description, projectId } = req.body;
  const project = await Project.findById(projectId);

  if (!project || !project.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
  }

  const task = await Task.create({ title, description, project: projectId });
  res.status(201).json(task);
};

export const getTasksByProject = async (req, res) => {
  const { projectId } = req.params;
  const tasks = await Task.find({ project: projectId }).populate('assignee', 'name email');
  res.status(200).json(tasks);
};

export const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
      return res.status(404).json({ message: 'Task not found' });
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
  });

  req.io.to(task.project.toString()).emit('taskUpdated', updatedTask);
  res.status(200).json(updatedTask);
};

export const deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    await task.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Task removed' });
};