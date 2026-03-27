import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function TaskModal({ task, projectId, defaultStatus, users, onClose, onSave, onDelete }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: defaultStatus || 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    estimatedHours: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [taskData, setTaskData] = useState(task);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee: task.assignee?._id || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
        tags: (task.tags || []).join(', '),
      });
      setTaskData(task);
    }
  }, [task]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    setLoading(true);
    const payload = {
      ...form,
      project: projectId,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      dueDate: form.dueDate || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      assignee: form.assignee || null,
    };
    try {
      let data;
      if (isEdit) {
        const res = await api.put(`/tasks/${task._id}`, payload);
        data = res.data;
        toast.success('Task updated');
      } else {
        const res = await api.post('/tasks', payload);
        data = res.data;
        toast.success('Task created');
      }
      onSave(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setTaskData(data);
      setComment('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    finally { setCommenting(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setForm(f => ({ ...f, status: newStatus }));
    if (isEdit) {
      try {
        await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
      } catch { /* will be saved on form submit */ }
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</div>
          <div className="flex gap-2">
            {isEdit && onDelete && (
              <button className="btn btn-danger btn-sm" onClick={() => onDelete(task._id)}>Delete</button>
            )}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {isEdit && (
          <div className="tab-bar" style={{ padding: '0 24px', marginBottom: 0 }}>
            {[['details','Details'],['comments','Comments']].map(([v,l]) => (
              <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}
                {v === 'comments' && taskData?.comments?.length > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--surface0)', borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem', color: 'var(--subtext0)' }}>
                    {taskData.comments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {tab === 'details' && (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="What needs to be done?" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Add details, context, links…" rows={3} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" name="status" value={form.status} onChange={e => handleStatusChange(e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-input" name="assignee" value={form.assignee} onChange={handleChange}>
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Estimated Hours</label>
                  <input className="form-input" type="number" name="estimatedHours" value={form.estimatedHours} onChange={handleChange} placeholder="0" min="0" step="0.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="bug, feature, urgent" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        )}

        {tab === 'comments' && isEdit && (
          <div className="modal-body">
            {/* Existing comments */}
            {taskData?.comments?.length === 0 && (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">💬</div>
                <div className="empty-state-title">No comments yet</div>
                <div className="empty-state-desc">Start the conversation.</div>
              </div>
            )}
            {taskData?.comments?.map(c => (
              <div key={c._id} className="comment">
                <div className="avatar" style={{ background: `hsl(${c.author?.name?.charCodeAt(0) * 15 || 200}, 60%, 45%)` }}>
                  {getInitials(c.author?.name)}
                </div>
                <div className="comment-body">
                  <div>
                    <span className="comment-author">{c.author?.name || 'Unknown'}</span>
                    <span className="comment-time">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              </div>
            ))}
            {/* Add comment */}
            <div className="divider" />
            <form onSubmit={handleComment}>
              <div className="flex gap-3 items-center">
                <div className="avatar" style={{ background: `hsl(${user?.name?.charCodeAt(0) * 15 || 200}, 60%, 45%)`, flexShrink: 0 }}>
                  {getInitials(user?.name)}
                </div>
                <input
                  className="form-input flex-1"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a comment…"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={commenting || !comment.trim()}>
                  {commenting ? '…' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
