import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name = '') {
  return `hsl(${(name.charCodeAt(0) || 65) * 15}, 55%, 42%)`;
}

export default function MembersPanel({ project, currentUserId, isOwner, isProjectAdmin, onProjectUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [adding, setAdding] = useState(false);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users?search=${encodeURIComponent(searchQuery)}`);
        // Filter out already-members and the owner
        const existingIds = new Set([
          String(project.owner?._id || project.owner),
          ...(project.members || []).map(m => String(m.user?._id || m.user)),
        ]);
        setSearchResults(data.filter(u => !existingIds.has(String(u._id))));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, project]);

  const handleAddMember = async (userId) => {
    setAdding(true);
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { userId, role: newMemberRole });
      onProjectUpdate(data);
      setSearchQuery('');
      setSearchResults([]);
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await api.patch(`/projects/${project._id}/members/${userId}`, { role });
      onProjectUpdate(data);
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId) => {
    const isSelf = String(userId) === String(currentUserId);
    const msg = isSelf ? 'Leave this project?' : 'Remove this member from the project?';
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/projects/${project._id}/members/${userId}`);
      onProjectUpdate(prev => ({
        ...prev,
        members: prev.members.filter(m => String(m.user?._id || m.user) !== String(userId)),
      }));
      toast.success(isSelf ? 'You left the project' : 'Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const owner = project.owner;
  const members = project.members || [];

  return (
    <div style={{ maxWidth: 680 }}>

      {/* ── Add member (admin/owner only) ── */}
      {isProjectAdmin && (
        <div className="card mb-4">
          <div className="section-title mb-1" style={{ fontSize: '0.95rem' }}>Add Member</div>
          <p className="text-xs text-muted mb-3">Search by name or email to invite someone to this project.</p>

          <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--overlay0)', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Search users by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="form-input" style={{ flex: '0 0 130px' }} value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Search results dropdown */}
          {(searching || searchResults.length > 0) && (
            <div className="card" style={{ padding: 0, marginTop: 4, overflow: 'hidden' }}>
              {searching && (
                <div style={{ padding: '12px 16px', color: 'var(--overlay1)', fontSize: '0.85rem' }}>Searching…</div>
              )}
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div style={{ padding: '12px 16px', color: 'var(--overlay1)', fontSize: '0.85rem' }}>No users found</div>
              )}
              {searchResults.map(u => (
                <div
                  key={u._id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 16px', borderBottom: '1px solid var(--surface0)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar" style={{ background: avatarColor(u.name) }}>{getInitials(u.name)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={adding}
                    onClick={() => handleAddMember(u._id)}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Owner row ── */}
      <div className="section-title mb-3" style={{ fontSize: '0.95rem' }}>
        Team ({members.length + 1} {members.length + 1 === 1 ? 'person' : 'people'})
      </div>

      <div className="card mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar avatar-lg" style={{ background: avatarColor(owner?.name) }}>
              {getInitials(owner?.name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{owner?.name}</div>
              <div className="text-xs text-muted">{owner?.email}</div>
              {owner?._id && String(owner._id) === String(currentUserId) && (
                <div className="text-xs" style={{ color: 'var(--accent)', marginTop: 2 }}>You</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge" style={{ background: 'rgba(203,166,247,0.15)', color: 'var(--accent)', border: '1px solid rgba(203,166,247,0.3)' }}>
              Owner
            </span>
          </div>
        </div>
      </div>

      {/* ── Member rows ── */}
      {members.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--overlay1)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 600, color: 'var(--subtext0)' }}>No members yet</div>
          <div className="text-xs" style={{ marginTop: 6 }}>
            {isProjectAdmin ? 'Use the search above to invite teammates.' : 'The owner has not added any members yet.'}
          </div>
        </div>
      )}

      {members.map(m => {
        const memberUser = m.user;
        const memberId = String(memberUser?._id || memberUser);
        const isSelf = memberId === String(currentUserId);
        const canChangeRole = isOwner && !isSelf;
        const canRemove = isProjectAdmin || isSelf;

        return (
          <div key={memberId} className="card mb-2">
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-lg" style={{ background: avatarColor(memberUser?.name) }}>
                  {getInitials(memberUser?.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{memberUser?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted">{memberUser?.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {isSelf && (
                      <span className="text-xs" style={{ color: 'var(--accent)' }}>You</span>
                    )}
                    {m.joinedAt && (
                      <span className="text-xs text-muted">
                        Joined {format(new Date(m.joinedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canChangeRole ? (
                  <select
                    className="form-input"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
                    value={m.role}
                    onChange={e => handleRoleChange(memberId, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`badge ${m.role === 'admin' ? 'badge-active' : 'badge-planning'}`}>
                    {m.role}
                  </span>
                )}

                {canRemove && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(memberId)}
                  >
                    {isSelf ? 'Leave' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Role legend ── */}
      <div className="card mt-4" style={{ padding: '14px 18px' }}>
        <div className="text-xs font-bold text-muted mb-2" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Role permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px' }}>
          {[
            ['Create tasks', '✓', '✓', '✓'],
            ['Edit tasks', '✓', '✓', '✓'],
            ['Delete tasks', '✓', '✓', '✓'],
            ['Edit project', '✓', '✓', '✗'],
            ['Add members', '✓', '✓', '✗'],
            ['Change roles', '✓', '✗', '✗'],
            ['Delete project', '✓', '✗', '✗'],
          ].map(([action, o, a, m]) => (
            <React.Fragment key={action}>
              <span className="text-xs text-muted">{action}</span>
              <span className="text-xs" style={{ color: o === '✓' ? 'var(--green)' : 'var(--red)', textAlign: 'center' }}>Owner {o}</span>
              <span className="text-xs" style={{ color: a === '✓' ? 'var(--green)' : 'var(--red)', textAlign: 'center' }}>Admin {a} · Member {m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
