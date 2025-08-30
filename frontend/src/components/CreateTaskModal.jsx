import React, { useState } from 'react';
import api from '../api/axiosConfig';

function CreateTaskModal({ isOpen, onClose, projectId, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      const response = await api.post('/tasks', {
        title,
        description,
        projectId,
      });
      onTaskCreated(response.data);
      onClose();
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      {/* 1. UPDATED MODAL CARD STYLING */}
      <div className="bg-gray-900/90 border border-white/10 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-white">Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-300 text-sm font-bold mb-2">
              Task Title
            </label>
            {/* 2. UPDATED INPUT STYLING */}
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-gray-700 text-white border-gray-600 focus:outline-none focus:border-violet-500"
              placeholder="e.g., Design the login page"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">
              Description (Optional)
            </label>
            {/* 2. UPDATED TEXTAREA STYLING */}
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-gray-700 text-white border-gray-600 focus:outline-none focus:border-violet-500"
              rows="3"
              placeholder="Add more details about the task..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            {/* 3. UPDATED BUTTON STYLING */}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;