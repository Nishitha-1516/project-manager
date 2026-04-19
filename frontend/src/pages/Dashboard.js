import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isAfter, isBefore, addDays } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name = '') {
  return `hsl(${(name?.charCodeAt(0) || 65) * 15}, 60%, 45%)`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [myTasks, setMyTasks]     = useState([]);
  const [allTasks, setAllTasks]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const pRes = await api.get('/projects');
        const loadedProjects = pRes.data;
        setProjects(loadedProjects);

        // Tasks assigned to / reported by the current user across all their projects
        const myRes = await api.get('/tasks?mine=true');
        setMyTasks(myRes.data);

        // Load tasks for active projects to show progress bars
        const activeProjects = loadedProjects.filter((p) => p.status === 'active');
        if (activeProjects.length > 0) {
          const taskResults = await Promise.all(
            activeProjects.map((p) => api.get(`/tasks?project=${p._id}`).then((r) => r.data))
          );
          setAllTasks(taskResults.flat());
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const overdueTasks = myTasks.filter(
    (t) => t.dueDate && isBefore(new Date(t.dueDate), new Date()) && t.status !== 'done'
  );
  const upcomingTasks = myTasks.filter(
    (t) =>
      t.dueDate &&
      isAfter(new Date(t.dueDate), new Date()) &&
      isBefore(new Date(t.dueDate), addDays(new Date(), 7)) &&
      t.status !== 'done'
  );
  const activeProjects = projects.filter((p) => p.status === 'active');
  const doneTasks      = myTasks.filter((t) => t.status === 'done').length;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div className="topbar-actions">
          <Link to="/projects" className="btn btn-primary btn-sm">+ New Project</Link>
        </div>
      </div>

      <div className="page-content">
        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted text-sm mt-1">
            Here's what's happening across your workspace.
          </p>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-4">
          <div className="card stat-card">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value accent">{projects.length}</div>
            <div className="stat-sub">{activeProjects.length} active</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">My Tasks</div>
            <div className="stat-value blue">{myTasks.length}</div>
            <div className="stat-sub">{doneTasks} completed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Overdue</div>
            <div
              className="stat-value"
              style={{ color: overdueTasks.length > 0 ? 'var(--red)' : 'var(--green)' }}
            >
              {overdueTasks.length}
            </div>
            <div className="stat-sub">tasks past due</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Due This Week</div>
            <div className="stat-value yellow">{upcomingTasks.length}</div>
            <div className="stat-sub">upcoming tasks</div>
          </div>
        </div>

        <div className="grid-2">
          {/* Active Projects with progress */}
          <div>
            <div className="section-header">
              <div>
                <div className="section-title">Active Projects</div>
                <div className="section-sub">Your current work streams</div>
              </div>
              <Link to="/projects" className="btn btn-ghost btn-sm">View all →</Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-state-icon">📂</div>
                  <div className="empty-state-title">No active projects</div>
                  <div className="empty-state-desc">
                    Create a project and set it to active to see it here.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeProjects.slice(0, 5).map((p) => {
                  const pTasks = allTasks.filter(
                    (t) => String(typeof t.project === 'object' ? t.project._id : t.project) === String(p._id)
                  );
                  const done = pTasks.filter((t) => t.status === 'done').length;
                  const pct  = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;

                  // Flatten members for avatar stack
                  const memberUsers = (p.members || []).map((m) => m.user).filter(Boolean);
                  const participants = [p.owner, ...memberUsers].filter(Boolean);

                  return (
                    <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-clickable project-card" style={{ '--color': p.color }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="project-card-name">{p.name}</div>
                          <div className="flex items-center gap-2">
                            <div className="member-stack">
                              {participants.slice(0, 3).map((m, i) => (
                                <div
                                  key={m._id || i}
                                  className="avatar"
                                  title={m.name}
                                  style={{ width: 22, height: 22, fontSize: '0.6rem', background: avatarColor(m.name) }}
                                >
                                  {getInitials(m.name)}
                                </div>
                              ))}
                            </div>
                            <span className={`badge badge-${p.priority}`}>{p.priority}</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">{done}/{pTasks.length} tasks done</span>
                          <span className="text-xs text-muted">{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Tasks */}
          <div>
            <div className="section-header">
              <div>
                <div className="section-title">My Tasks</div>
                <div className="section-sub">Assigned to or reported by you</div>
              </div>
            </div>

            {myTasks.filter((t) => t.status !== 'done').length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">All caught up!</div>
                  <div className="empty-state-desc">No pending tasks assigned to you.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myTasks
                  .filter((t) => t.status !== 'done')
                  .slice(0, 6)
                  .map((task) => (
                    <div key={task._id} className="card" style={{ padding: '14px 16px' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge badge-${task.status}`}>{task.status}</span>
                        {task.dueDate && (
                          <span
                            className={`due-date ${
                              isBefore(new Date(task.dueDate), new Date())
                                ? 'overdue'
                                : isAfter(new Date(task.dueDate), addDays(new Date(), 3))
                                ? ''
                                : 'soon'
                            }`}
                          >
                            📅{' '}
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
