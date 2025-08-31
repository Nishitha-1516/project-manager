import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import { useDrop } from 'react-dnd';
import io from 'socket.io-client';

const ItemTypes = { TASK: 'task' };

const Column = ({ title, status, tasks, moveTask, onCardClick }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item) => moveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="bg-gray-800/50 backdrop-blur-md rounded-lg p-4 w-1/3 transition-colors border border-white/10"
      style={{ backgroundColor: isOver ? 'rgba(124, 58, 237, 0.3)' : '' }}
    >
      <h3 className="font-bold text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            moveTask={moveTask}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

function ProjectBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const [projectRes, tasksRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/tasks/project/${projectId}`)
        ]);
        setProject(projectRes.data);
        setTasks(tasksRes.data);
        setError('');
      } catch (err) {
        setError('Failed to load project data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjectData();

    const socket = io('http://localhost:5001');
    socket.emit('joinProject', projectId);
    socket.on('taskUpdated', (updatedTask) => {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  const handleTaskCreated = (newTask) => {
    setTasks((currentTasks) => [...currentTasks, newTask]);
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  if (loading) return <div className="text-white text-center p-10">Loading...</div>;
  if (error) return <div className="text-red-400 text-center p-10">{error}</div>;

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTasksByStatus = (status) => filteredTasks.filter(task => task.status === status);

  return (
    <>
      <div className="w-full min-h-screen">
        <header className="bg-gray-900/50 backdrop-blur-lg shadow-lg w-full p-4 flex justify-between items-center fixed top-0 left-0 z-10 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-violet-700 hover:to-gray-800 text-white font-semibold py-2 px-5 rounded-full shadow-lg transition-all duration-200 border border-violet-500/30 hover:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
            >
              <span className="text-lg">&larr;</span>
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold text-white">{project ? project.name : 'Loading...'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={`/project/${projectId}/analytics`}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition-all duration-200 border border-violet-400/30 hover:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19V6M7 19V10M15 19V14M19 19V12" />
              </svg>
              <span>View Analytics</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-violet-600 hover:to-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition-all duration-200 border border-green-300/30 hover:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
            >
              <span className="text-lg font-bold">+</span>
              <span>Add New Task</span>
            </button>
          </div>
        </header>

        <main className="p-8 mt-24">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search tasks by title..."
              className="w-full p-3 rounded-lg bg-gray-900/70 text-white border border-white/10 focus:border-violet-400 focus:ring-violet-400 focus:outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex justify-between gap-6">
            <Column title="To Do" status="To Do" tasks={getTasksByStatus('To Do')} moveTask={moveTask} onCardClick={handleCardClick} />
            <Column title="In Progress" status="In Progress" tasks={getTasksByStatus('In Progress')} moveTask={moveTask} onCardClick={handleCardClick} />
            <Column title="Done" status="Done" tasks={getTasksByStatus('Done')} moveTask={moveTask} onCardClick={handleCardClick} />
          </div>
        </main>
      </div>

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} projectId={projectId} onTaskCreated={handleTaskCreated} />

      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default ProjectBoard;