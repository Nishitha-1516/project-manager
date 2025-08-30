import React from 'react';
import { useDrag } from 'react-dnd';

const ItemTypes = { TASK: 'task' };

function TaskCard({ task, moveTask, onCardClick }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task._id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onCardClick(task)}
      className="bg-gray-900/80 p-3 rounded-md shadow-lg cursor-grab hover:bg-gray-700/80 transition-colors border border-white/10"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <p className="font-semibold text-white">{task.title}</p>
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
        <div className="text-xs text-gray-400">
          {task.status !== 'To Do' && (
            <button 
              onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status === 'In Progress' ? 'To Do' : 'In Progress'); }}
              className="hover:text-violet-400"
            >
              &larr; Back
            </button>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {task.status !== 'Done' && (
            <button 
              onClick={(e) => { e.stopPropagation(); moveTask(task._id, task.status === 'To Do' ? 'In Progress' : 'Done'); }}
              className="hover:text-violet-400"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;