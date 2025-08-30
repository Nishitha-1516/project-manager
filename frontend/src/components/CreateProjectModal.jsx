import React, { useState } from 'react';
import api from '../api/axiosConfig'; // Use our configured api instance

function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/projects', { name, description });
      onProjectCreated(response.data); // Pass the new project back to the dashboard
      onClose(); // Close the modal
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    // Modal Backdrop
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Project Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;