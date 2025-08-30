import Project from '../models/Project.js';

export const createProject = async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({
    name,
    description,
    owner: req.user.id,
  });
  res.status(201).json(project);
};

export const getProjects = async (req, res) => {
  const projects = await Project.find({ members: req.user.id });
  res.status(200).json(projects);
};

export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id).populate('members', 'name email');

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!project.members.some(member => member._id.equals(req.user.id))) {
    return res.status(403).json({ message: 'User not authorized for this project' });
  }

  res.status(200).json(project);
};