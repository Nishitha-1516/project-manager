import React from 'react';

function TaskDetailModal({ task, isOpen, onClose }) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{task.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div>
          <p className="text-gray-600 mb-2">**Status:** {task.status}</p>
          <p className="text-gray-700">{task.description || 'No description provided.'}</p>
        </div>
        {/* We can add editing functionality here later */}
      </div>
    </div>
  );
}

export default TaskDetailModal;