import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { format, isBefore } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useProjectSocket } from '../hooks/useProjectSocket';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import MembersPanel from '../components/MembersPanel';
import ConnectionBadge from '../components/ConnectionBadge';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',      color: 'var(--overlay2)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--mauve)'   },
  { id: 'review',      label: 'Review',      color: 'var(--yellow)'  },
  { id: 'done',        label: 'Done',        color: 'var(--green)'   },
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function buildStats(tasks) {
  return {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review:     tasks.filter(t => t.status === 'review').length,
    done:       tasks.filter(t => t.status === 'done').length,
  };
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]             = useState(null);
  const [tasks, setTasks]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [selectedTask, setSelectedTask]   = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [stats, setStats]                 = useState(null);

  // ── Initial data load ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes, sRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/projects/${id}/stats`),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setStats(sRes.data);
    } catch {
      toast.error('Project not found or access denied');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Real-time socket handlers ──────────────────────────────────────────────
  const currentUserId = String(user?._id);

  useProjectSocket(id, {
    onTaskCreated: (task) => {
      setTasks(prev => {
        if (prev.find(t => t._id === task._id)) return prev; // duplicate guard
        const next = [task, ...prev];
        setStats(buildStats(next));
        return next;
      });
      toast('New task added', { icon: '📋' });
    },

    onTaskUpdated: (task) => {
      setTasks(prev => {
        const next = prev.map(t => t._id === task._id ? task : t);
        setStats(buildStats(next));
        return next;
      });
    },

    onTaskDeleted: ({ taskId }) => {
      setTasks(prev => {
        const next = prev.filter(t => t._id !== taskId);
        setStats(buildStats(next));
        return next;
      });
      // Close modal if it was showing the deleted task
      setSelectedTask(prev => prev?._id === taskId ? null : prev);
      if (selectedTask?._id === taskId) setShowTaskModal(false);
    },

    onTaskStatusChanged: ({ taskId, status, task }) => {
      setTasks(prev => {
        const next = prev.map(t => t._id === taskId ? { ...t, status, ...(task || {}) } : t);
        setStats(buildStats(next));
        return next;
      });
    },

    onProjectUpdated: (updatedProject) => {
      setProject(updatedProject);
      toast('Project details updated', { icon: '✏️' });
    },

    onProjectDeleted: () => {
      navigate('/projects');
    },

    onMembersUpdated: (payload) => {
      // If it's a full project object, replace; if it's a removal payload, patch members
      if (payload.members && !payload.removedUserId) {
        setProject(payload);
      } else if (payload.removedUserId) {
        if (String(payload.removedUserId) === currentUserId) {
          navigate('/projects');
        } else {
          setProject(prev => prev ? {
            ...prev,
            members: prev.members.filter(
              m => String(m.user?._id || m.user) !== String(payload.removedUserId)
            ),
          } : prev);
        }
      }
    },
  }, currentUserId);

  // ── Role helpers ───────────────────────────────────────────────────────────
  const isOwner        = project ? String(project.owner?._id || project.owner) === currentUserId : false;
  const myMembership   = project?.members?.find(m => String(m.user?._id || m.user) === currentUserId);
  const isProjectAdmin = isOwner || myMembership?.role === 'admin';

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    // Optimistic update
    setTasks(prev => {
      const next = prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t);
      setStats(buildStats(next));
      return next;
    });

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
      // Socket will broadcast to other users; our own optimistic update already applied
    } catch {
      toast.error('Failed to update task status');
      loadData();
    }
  };

  // ── Task save / delete ─────────────────────────────────────────────────────
  const handleTaskSave = (task) => {
    // Socket will propagate to other users; update own state too
    setTasks(prev => {
      const exists = prev.find(t => t._id === task._id);
      const next = exists ? prev.map(t => t._id === task._id ? task : t) : [task, ...prev];
      setStats(buildStats(next));
      return next;
    });
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      // Optimistic — socket event will also arrive and is idempotent
      setTasks(prev => {
        const next = prev.filter(t => t._id !== taskId);
        setStats(buildStats(next));
        return next;
      });
      setShowTaskModal(false);
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return null;

  const completionPct = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const projectUsers  = [project.owner, ...(project.members || []).map(m => m.user)].filter(Boolean);

  return (
    <div>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}>←</button>
          <div style={{ minWidth: 0 }}>
            <div className="topbar-title truncate">{project.name}</div>
          </div>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
          <span className={`badge badge-${project.priority}`}>{project.priority}</span>
          {isOwner && (
            <span className="badge" style={{ background: 'rgba(203,166,247,0.15)', color: 'var(--accent)', border: '1px solid rgba(203,166,247,0.3)' }}>Owner</span>
          )}
          {!isOwner && myMembership && (
            <span className="badge" style={{ background: 'rgba(166,227,161,0.12)', color: 'var(--green)', border: '1px solid rgba(166,227,161,0.25)' }}>{myMembership.role}</span>
          )}
        </div>
        <div className="topbar-actions">
          <ConnectionBadge />
          {isProjectAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProjModal(true)}>⚙ Edit</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedTask(null); setDefaultStatus('todo'); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      <div className="page-content">
        {project.description && <p className="text-muted text-sm mb-4">{project.description}</p>}

        {/* ── Stats ── */}
        <div className="grid-4 mb-4">
          {[
            { label: 'Total Tasks', value: stats?.total || 0,      cls: '' },
            { label: 'In Progress', value: stats?.inProgress || 0, cls: 'accent' },
            { label: 'In Review',   value: stats?.review || 0,     cls: 'yellow' },
            { label: 'Completed',   value: stats?.done || 0,       cls: 'green' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Progress ── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Overall Progress</span>
            <span className="font-mono text-sm text-accent">{completionPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
            {COLUMNS.map(col => (
              <span key={col.id} className="text-xs text-muted">
                <span style={{ color: col.color }}>■</span> {col.label}: {tasks.filter(t => t.status === col.id).length}
              </span>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar">
          {[
            ['board',   'Kanban Board'],
            ['list',    'List View'],
            ['members', `Members (${(project.members?.length || 0) + 1})`],
          ].map(([v, l]) => (
            <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {/* ── Kanban ── */}
        {tab === 'board' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-col">
                    <div className="kanban-col-header">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                        <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="kanban-col-count">{colTasks.length}</span>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ fontSize: '1.1rem', lineHeight: 1 }}
                          onClick={() => { setSelectedTask(null); setDefaultStatus(col.id); setShowTaskModal(true); }}
                        >+</button>
                      </div>
                    </div>
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`kanban-col-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                        >
                          {colTasks.map((task, idx) => (
                            <Draggable key={task._id} draggableId={task._id} index={idx}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                  onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                                >
                                  <div className="task-card-title">{task.title}</div>
                                  <div className="task-card-meta">
                                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                    {task.tags?.length > 0 && <span className="tag">{task.tags[0]}</span>}
                                  </div>
                                  <div className="task-card-footer">
                                    {task.dueDate ? (
                                      <span className={`due-date ${isBefore(new Date(task.dueDate), new Date()) && task.status !== 'done' ? 'overdue' : ''}`}>
                                        📅 {format(new Date(task.dueDate), 'MMM d')}
                                      </span>
                                    ) : <span />}
                                    {task.assignee && (
                                      <div
                                        className="avatar"
                                        title={task.assignee.name}
                                        style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${(task.assignee.name?.charCodeAt(0) || 65) * 15}, 55%, 42%)` }}
                                      >
                                        {getInitials(task.assignee.name)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div style={{ textAlign: 'center', color: 'var(--overlay0)', fontSize: '0.8rem', padding: '20px 0' }}>
                              Drop here or click + to add
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* ── List view ── */}
        {tab === 'list' && (
          <div>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No tasks yet</div>
                <div className="empty-state-desc">Add your first task to get started.</div>
                <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setDefaultStatus('todo'); setShowTaskModal(true); }}>+ Add Task</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="card" style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 110px 100px 130px 36px', gap: 12, alignItems: 'center' }}>
                  {['Task','Status','Priority','Assignee',''].map(h => (
                    <span key={h} className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {tasks.map(task => (
                  <div
                    key={task._id}
                    className="card card-clickable"
                    style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 110px 100px 130px 36px', gap: 12, alignItems: 'center' }}
                    onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</div>
                      {task.dueDate && (
                        <div className={`due-date mt-1 ${isBefore(new Date(task.dueDate), new Date()) && task.status !== 'done' ? 'overdue' : ''}`}>
                          📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <div className="flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${(task.assignee.name?.charCodeAt(0) || 65) * 15}, 55%, 42%)` }}>
                            {getInitials(task.assignee.name)}
                          </div>
                          <span className="text-xs truncate">{task.assignee.name}</span>
                        </>
                      ) : <span className="text-xs text-muted">Unassigned</span>}
                    </div>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={e => { e.stopPropagation(); handleTaskDelete(task._id); }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Members tab ── */}
        {tab === 'members' && (
          <MembersPanel
            project={project}
            currentUserId={currentUserId}
            isOwner={isOwner}
            isProjectAdmin={isProjectAdmin}
            onProjectUpdate={setProject}
          />
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          defaultStatus={defaultStatus}
          users={projectUsers}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}

      {showProjModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjModal(false)}
          onSave={(p) => { setProject(p); setShowProjModal(false); }}
        />
      )}
    </div>
  );
}
