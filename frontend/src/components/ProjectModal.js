import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const COLORS = ['#cba6f7','#89b4fa','#94e2d5','#a6e3a1','#f9e2af','#fab387','#f38ba8','#74c7ec','#b4befe'];

export default function ProjectModal({ project, onClose, onSave }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name:        '',
    description: '',
    status:      'planning',
    priority:    'medium',
    color:       '#cba6f7',
    dueDate:     '',
    tags:        '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name:        project.name        || '',
        description: project.description || '',
        status:      project.status      || 'planning',
        priority:    project.priority    || 'medium',
        color:       project.color       || '#cba6f7',
        dueDate:     project.dueDate ? project.dueDate.split('T')[0] : '',
        tags:        (project.tags || []).join(', '),
      });
    }
  }, [project]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    const payload = {
      ...form,
      tags:    form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      dueDate: form.dueDate || undefined,
    };
    try {
      let data;
      if (isEdit) {
        const res = await api.put(`/projects/${project._id}`, payload);
        data = res.data;
        toast.success('Project updated');
      } else {
        const res = await api.post('/projects', payload);
        data = res.data;
        toast.success('Project created');
      }
      onSave(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Project' : 'New Project'}</div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Website Redesign" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="What is this project about?" rows={3} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
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
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="design, frontend, backend" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c,
                      border: 'none', cursor: 'pointer',
                      outline: form.color === c ? '3px solid white' : 'none',
                      outlineOffset: 2,
                      transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
