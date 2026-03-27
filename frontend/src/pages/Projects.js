import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ProjectModal from '../components/ProjectModal';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => p.filter((x) => x._id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Projects</div>
        <div className="topbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { setEditProject(null); setShowModal(true); }}>
            + New Project
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1 1 200px', maxWidth: 300 }}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {['all', 'planning', 'active', 'on-hold', 'completed'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-4">
          {[
            { label: 'Total Projects', key: 'all', cls: 'accent' },
            { label: 'Active', key: 'active', cls: 'green' },
            { label: 'On Hold', key: 'on-hold', cls: 'yellow' },
            { label: 'Completed', key: 'completed', cls: 'blue' },
          ].map((s) => (
            <div key={s.key} className="card stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>
                {s.key === 'all' ? projects.length : projects.filter((p) => p.status === s.key).length}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">
              {search || filter !== 'all' ? 'No matching projects' : 'No projects yet'}
            </div>
            <div className="empty-state-desc">
              {search || filter !== 'all' ? 'Try adjusting your filters.' : 'Create your first project to get started.'}
            </div>
            {!search && filter === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((p) => {
              // members is now [{ user: {...}, role }]
              const memberUsers = (p.members || []).map((m) => m.user).filter(Boolean);
              const allPeople = [p.owner, ...memberUsers].filter(Boolean);

              return (
                <div key={p._id} className="card project-card" style={{ '--color': p.color || '#cba6f7' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Edit"
                        onClick={() => { setEditProject(p); setShowModal(true); }}
                      >✏️</button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Delete"
                        onClick={() => handleDelete(p._id)}
                      >🗑️</button>
                    </div>
                  </div>

                  <Link to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                    <div className="project-card-name">{p.name}</div>
                    <div className="project-card-desc">{p.description || 'No description provided.'}</div>
                  </Link>

                  <div className="divider" />

                  <div className="project-card-footer">
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${p.priority}`}>{p.priority}</span>
                      {p.dueDate && (
                        <span className="text-xs text-muted">
                          Due {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="member-stack">
                      {allPeople.slice(0, 4).map((m, i) => (
                        <div
                          key={m._id || i}
                          className="avatar"
                          title={m.name}
                          style={{ background: `hsl(${(m.name?.charCodeAt(0) || 65) * 15}, 60%, 45%)` }}
                        >
                          {getInitials(m.name)}
                        </div>
                      ))}
                      {allPeople.length > 4 && (
                        <div className="avatar" style={{ background: 'var(--surface1)', color: 'var(--subtext0)', fontSize: '0.6rem' }}>
                          +{allPeople.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={(p) => {
            if (editProject) setProjects((prev) => prev.map((x) => x._id === p._id ? p : x));
            else setProjects((prev) => [p, ...prev]);
            setShowModal(false);
            setEditProject(null);
          }}
        />
      )}
    </div>
  );
}
