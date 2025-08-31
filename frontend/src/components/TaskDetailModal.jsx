import React from 'react';

function TaskDetailModal({ task, isOpen, onClose }) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-900/90 border border-white/10 p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div>
          <p className="text-gray-300 mb-2 font-semibold">Status: <span className="font-normal">{task.status}</span></p>
          {/* ADD DUE DATE DISPLAY */}
          {task.dueDate && (
            <p className="text-gray-300 mb-4 font-semibold">Due Date: <span className="font-normal">{new Date(task.dueDate).toLocaleDateString()}</span></p>
          )}
          <p className="text-gray-300 mt-4">{task.description || 'No description provided.'}</p>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailModal;