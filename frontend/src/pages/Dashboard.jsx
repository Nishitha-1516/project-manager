import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import CreateProjectModal from '../components/CreateProjectModal';
import Logo from '../components/Logo';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
  };

  return (
    <>
      <div className="w-full h-full flex flex-col items-center">
        <header className="bg-gray-900/50 backdrop-blur-lg shadow-lg w-full p-4 flex justify-between items-center fixed top-0 left-0 z-10 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-bold text-white">Project Dashboard</h1>
          </div>
          <div className="flex items-center">
            <span className="text-gray-200 mr-4">Welcome, {user ? user.name : 'Guest'}!</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </header>

        <main className="w-full max-w-6xl p-8 mt-24">
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl text-white font-bold">Your Projects</h2>
              <button onClick={() => setIsModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                + Create New Project
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <Link key={project._id} to={`/project/${project._id}`}>
                    <div className="bg-gray-900/60 p-4 rounded-lg shadow-lg hover:shadow-violet-500/30 transition-shadow duration-300 cursor-pointer h-full border border-white/10">
                      <h3 className="text-xl font-bold text-white">{project.name}</h3>
                      <p className="text-gray-300 mt-2">{project.description}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-300">You have no projects yet. Start by creating a new one.</p>
              )}
            </div>
          </div>
        </main>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}

export default Dashboard;