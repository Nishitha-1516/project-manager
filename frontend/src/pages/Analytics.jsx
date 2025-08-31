import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Spinner from '../components/Spinner';

const COLORS = ['#FFBB28', '#00C49F', '#0088FE']; // To Do (Yellow), In Progress (Green), Done (Blue)

function Analytics() {
  const { projectId } = useParams();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/analytics/summary/${projectId}`);
        const statusOrder = ['To Do', 'In Progress', 'Done'];
        const sortedSummary = response.data.sort((a, b) => statusOrder.indexOf(a.name) - statusOrder.indexOf(b.name));
        setSummary(sortedSummary);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [projectId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <header className="bg-gray-900/50 backdrop-blur-lg shadow-lg w-full p-4 fixed top-0 left-0 z-10 border-b border-white/10 flex items-center gap-4">
        <Link
          to={`/project/${projectId}`}
          className="flex items-center gap-2 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-violet-700 hover:to-gray-800 text-white font-semibold py-2 px-5 rounded-full shadow-lg transition-all duration-200 border border-violet-500/30 hover:border-violet-400/70 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
        >
          <span className="text-lg">&larr;</span>
          <span>Back to Project Board</span>
        </Link>
        <h1 className="text-2xl font-bold text-white">Project Analytics</h1>
      </header>

      <main className="w-full max-w-4xl mx-auto p-8 mt-24">
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/10">
          <h2 className="text-2xl text-white font-bold mb-6">Task Status Distribution</h2>
          {summary.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={summary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
                    {summary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(31, 41, 55, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Legend wrapperStyle={{ color: '#d1d5db' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-300 text-center py-10">No task data available to display analytics.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Analytics;