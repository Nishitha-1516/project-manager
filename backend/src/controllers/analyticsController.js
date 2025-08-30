import Task from '../models/Task.js';
import mongoose from 'mongoose';

export const getProjectSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const taskStatusSummary = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const formattedSummary = taskStatusSummary.map(item => ({
      name: item._id,
      value: item.count,
    }));

    res.status(200).json(formattedSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};