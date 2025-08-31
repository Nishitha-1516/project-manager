import React from 'react';
import { useDrag } from 'react-dnd';

const ItemTypes = { TASK: 'task' };

function TaskCard({ task, moveTask, onCardClick }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  // Helper function to format date and check if it's overdue
  const getDueDateInfo = () => {
    if (!task.dueDate) return { text: null, isOverdue: false };
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    const isOverdue = dueDate < today;
    const dateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { text: dateText, isOverdue };
  };

  const { text: dueDateText, isOverdue } = getDueDateInfo();

  return (
    <div
      ref={drag}
      onClick={() => onCardClick(task)}
      className="bg-gray-900/80 p-3 rounded-md shadow-lg cursor-grab hover:bg-gray-700/80 transition-colors border border-white/10"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <p className="font-semibold text-white">{task.title}</p>
      
      {task.imageUrl && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}

      {/* DISPLAY THE DUE DATE */}
      {dueDateText && (
        <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded-full inline-block ${
          isOverdue ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'
        }`}>
          Due: {dueDateText}
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
        <div className="text-xs text-gray-400">
          {task.status !== 'To Do' && (
            <button onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status === 'In Progress' ? 'To Do' : 'In Progress'); }} className="hover:text-violet-400">&larr; Back</button>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {task.status !== 'Done' && (
            <button onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status === 'To Do' ? 'In Progress' : 'Done'); }} className="hover:text-violet-400">Next &rarr;</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;