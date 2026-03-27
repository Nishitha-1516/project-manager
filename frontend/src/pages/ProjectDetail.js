import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { format, isBefore } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import MembersPanel from '../components/MembersPanel';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'var(--overlay2)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--mauve)'   },
  { id: 'review',      label: 'Review',      color: 'var(--yellow)'  },
  { id: 'done',        label: 'Done',        color: 'var(--green)'   },
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]           = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('board');
  const [showTaskModal, setShowTaskModal]       = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus]       = useState('todo');
  const [stats, setStats]               = useState(null);
  const [projectUsers, setProjectUsers] = useState([]); // members + owner for assignment
  const [allUsers, setAllUsers]         = useState([]); // all registered users for invite

  // ── derived role flags ──────────────────────────────────────────────────
  const isOwner = project ? String(project.owner?._id) === String(user?._id) : false;
  const myMembership = project?.members?.find((m) => String(m.user?._id) === String(user?._id));
  const isProjectAdmin = isOwner || myMembership?.role === 'admin';

  // ── data loading ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes, sRes, uAllRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/projects/${id}/stats`),
        api.get('/users/all'),
      ]);
      const proj = pRes.data;
      setProject(proj);
      setTasks(tRes.data);
      setStats(sRes.data);
      setAllUsers(uAllRes.data);

      // Build the assignable list: owner + members
      const memberUsers = (proj.members || []).map((m) => m.user).filter(Boolean);
      setProjectUsers([proj.owner, ...memberUsers].filter(Boolean));
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── drag & drop ──────────────────────────────────────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    setTasks((prev) => prev.map((t) => t._id === draggableId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch {
      toast.error('Failed to update task status');
      loadData();
    }
  };

  // ── task callbacks ───────────────────────────────────────────────────────
  const handleTaskSave = (task) => {
    setTasks((prev) => {
      const exists = prev.find((t) => t._id === task._id);
      return exists ? prev.map((t) => t._id === task._id ? task : t) : [task, ...prev];
    });
    setShowTaskModal(false);
    setSelectedTask(null);
    loadData(); // refresh stats
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setShowTaskModal(false);
      setSelectedTask(null);
      toast.success('Task deleted');
      loadData();
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return null;

  const completionPct = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}>←</button>
          <div className="topbar-title">{project.name}</div>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
          <span className={`badge badge-${project.priority}`}>{project.priority}</span>
        </div>
        <div className="topbar-actions">
          {isProjectAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProjectModal(true)}>⚙ Edit</button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setSelectedTask(null); setDefaultStatus('todo'); setShowTaskModal(true); }}
          >
            + Add Task
          </button>
        </div>
      </div>

      <div className="page-content">
        {project.description && (
          <p className="text-muted text-sm mb-4">{project.description}</p>
        )}

        {/* ── Stats row ── */}
        <div className="grid-4 mb-4">
          {[
            { label: 'Total Tasks',  value: stats?.total      || 0, cls: ''       },
            { label: 'In Progress',  value: stats?.inProgress || 0, cls: 'accent' },
            { label: 'In Review',    value: stats?.review     || 0, cls: 'yellow' },
            { label: 'Completed',    value: stats?.done       || 0, cls: 'green'  },
          ].map((s) => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Overall Progress</span>
            <span className="font-mono text-sm text-accent">{completionPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
            {COLUMNS.map((col) => (
              <span key={col.id} className="text-xs text-muted">
                <span style={{ color: col.color }}>■</span> {col.label}: {tasks.filter((t) => t.status === col.id).length}
              </span>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-bar">
          {[['board','Kanban Board'], ['list','List View'], ['members','Members']].map(([v, l]) => (
            <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>
              {l}
              {v === 'members' && (
                <span style={{ marginLeft: 6, background: 'var(--surface0)', borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', color: 'var(--subtext0)' }}>
                  {1 + (project.members?.length || 0)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Kanban Board ── */}
        {tab === 'board' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.id);
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
                                    {task.tags?.[0] && <span className="tag">{task.tags[0]}</span>}
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
                                        style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${(task.assignee.name?.charCodeAt(0) || 65) * 15}, 60%, 45%)` }}
                                        title={task.assignee.name}
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

        {/* ── List View ── */}
        {tab === 'list' && (
          <div>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No tasks yet</div>
                <div className="empty-state-desc">Add your first task to get started.</div>
                <button
                  className="btn btn-primary"
                  onClick={() => { setSelectedTask(null); setDefaultStatus('todo'); setShowTaskModal(true); }}
                >+ Add Task</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="card" style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 110px 100px 140px 36px', gap: 12, alignItems: 'center' }}>
                  {['Task', 'Status', 'Priority', 'Assignee', ''].map((h) => (
                    <span key={h} className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="card card-clickable"
                    style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 110px 100px 140px 36px', gap: 12, alignItems: 'center' }}
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
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${(task.assignee.name?.charCodeAt(0) || 65) * 15}, 60%, 45%)` }}>
                            {getInitials(task.assignee.name)}
                          </div>
                          <span className="text-xs truncate">{task.assignee.name}</span>
                        </>
                      ) : <span className="text-xs text-muted">Unassigned</span>}
                    </div>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={(e) => { e.stopPropagation(); handleTaskDelete(task._id); }}
                      title="Delete"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Members Tab ── */}
        {tab === 'members' && (
          <MembersPanel
            project={project}
            allUsers={allUsers}
            isProjectAdmin={isProjectAdmin}
            isOwner={isOwner}
            currentUserId={user?._id}
            onProjectUpdate={(updated) => {
              setProject(updated);
              const memberUsers = (updated.members || []).map((m) => m.user).filter(Boolean);
              setProjectUsers([updated.owner, ...memberUsers].filter(Boolean));
            }}
          />
        )}
      </div>

      {/* ── Modals ── */}
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

      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSave={(p) => { setProject(p); setShowProjectModal(false); }}
        />
      )}
    </div>
  );
}
