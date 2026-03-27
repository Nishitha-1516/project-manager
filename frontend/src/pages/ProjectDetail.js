import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { format, isBefore } from 'date-fns';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'var(--overlay2)' },
  { id: 'in-progress', label: 'In Progress', color: 'var(--mauve)' },
  { id: 'review', label: 'Review', color: 'var(--yellow)' },
  { id: 'done', label: 'Done', color: 'var(--green)' },
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes, sRes, uRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
        api.get(`/projects/${id}/stats`),
        api.get('/users'),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setStats(sRes.data);
      setUsers(uRes.data);
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
      setStats(prev => prev ? {
        ...prev,
        [source.droppableId.replace('-','')]: (prev[source.droppableId.replace('-','')] || 1) - 1,
        [newStatus.replace('-','')]: (prev[newStatus.replace('-','')] || 0) + 1,
      } : prev);
    } catch {
      toast.error('Failed to update task status');
      loadData();
    }
  };

  const handleTaskSave = (task) => {
    setTasks(prev => {
      const exists = prev.find(t => t._id === task._id);
      return exists ? prev.map(t => t._id === task._id ? task : t) : [task, ...prev];
    });
    setShowTaskModal(false);
    setSelectedTask(null);
    loadData();
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setShowTaskModal(false);
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return null;

  const completionPct = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}>←</button>
          <div>
            <div className="topbar-title">{project.name}</div>
          </div>
          <span className={`badge badge-${project.status}`}>{project.status}</span>
          <span className={`badge badge-${project.priority}`}>{project.priority}</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProjectModal(true)}>⚙ Edit</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedTask(null); setDefaultStatus('todo'); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Project header */}
        {project.description && (
          <p className="text-muted text-sm mb-4">{project.description}</p>
        )}

        {/* Stats */}
        <div className="grid-4 mb-4">
          {[
            { label: 'Total Tasks', value: stats?.total || 0, cls: '' },
            { label: 'In Progress', value: stats?.inProgress || 0, cls: 'accent' },
            { label: 'In Review', value: stats?.review || 0, cls: 'yellow' },
            { label: 'Completed', value: stats?.done || 0, cls: 'green' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
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

        {/* Tabs */}
        <div className="tab-bar">
          {[['board','Kanban Board'],['list','List View']].map(([v, l]) => (
            <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {/* Kanban */}
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
                          title="Add task"
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
                                    {task.tags?.length > 0 && (
                                      <span className="tag">{task.tags[0]}</span>
                                    )}
                                  </div>
                                  <div className="task-card-footer">
                                    {task.dueDate ? (
                                      <span className={`due-date ${isBefore(new Date(task.dueDate), new Date()) && task.status !== 'done' ? 'overdue' : ''}`}>
                                        📅 {format(new Date(task.dueDate), 'MMM d')}
                                      </span>
                                    ) : <span />}
                                    {task.assignee ? (
                                      <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${task.assignee.name?.charCodeAt(0) * 15 || 200}, 60%, 45%)` }} title={task.assignee.name}>
                                        {getInitials(task.assignee.name)}
                                      </div>
                                    ) : null}
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

        {/* List view */}
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
                {/* Header */}
                <div className="card" style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 36px', gap: 12, alignItems: 'center' }}>
                  <span className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Task</span>
                  <span className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</span>
                  <span className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Priority</span>
                  <span className="text-xs text-muted font-bold" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>Assignee</span>
                  <span />
                </div>
                {tasks.map(task => (
                  <div
                    key={task._id}
                    className="card card-clickable"
                    style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px 36px', gap: 12, alignItems: 'center' }}
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
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${task.assignee.name?.charCodeAt(0) * 15 || 200}, 60%, 45%)` }}>
                            {getInitials(task.assignee.name)}
                          </div>
                          <span className="text-xs truncate">{task.assignee.name}</span>
                        </>
                      ) : <span className="text-xs text-muted">Unassigned</span>}
                    </div>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={e => { e.stopPropagation(); handleTaskDelete(task._id); }}
                      title="Delete"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          defaultStatus={defaultStatus}
          users={users}
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
