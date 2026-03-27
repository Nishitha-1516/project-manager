import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

function getInitials(name = '') {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const ROLE_BADGE = {
    owner: { bg: 'rgba(203,166,247,0.15)', color: 'var(--accent)', label: 'Owner' },
    admin: { bg: 'rgba(137,180,250,0.15)', color: 'var(--blue)', label: 'Admin' },
    member: { bg: 'rgba(108,112,134,0.2)', color: 'var(--overlay2)', label: 'Member' },
};

function RoleBadge({ role }) {
    const s = ROLE_BADGE[role] || ROLE_BADGE.member;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {s.label}
        </span>
    );
}

export default function MembersPanel({ project, allUsers, isProjectAdmin, isOwner, currentUserId, onProjectUpdate }) {
    const [newUserId, setNewUserId] = useState('');
    const [newRole, setNewRole] = useState('member');
    const [saving, setSaving] = useState(false);

    // People already in the project (owner + members)
    const existingIds = new Set([
        String(project.owner?._id),
        ...(project.members || []).map((m) => String(m.user?._id)),
    ]);

    // Candidates for invite: all registered users not already in project
    const inviteCandidates = allUsers.filter((u) => !existingIds.has(String(u._id)));

    const handleAdd = async () => {
        if (!newUserId) { toast.error('Select a user to add'); return; }
        setSaving(true);
        try {
            const { data } = await api.post(`/projects/${project._id}/members`, { userId: newUserId, role: newRole });
            onProjectUpdate(data);
            setNewUserId('');
            setNewRole('member');
            toast.success('Member added');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add member');
        } finally {
            setSaving(false);
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
        if (!window.confirm(isSelf ? 'Leave this project?' : 'Remove this member?')) return;
        try {
            await api.delete(`/projects/${project._id}/members/${userId}`);
            onProjectUpdate({ ...project, members: project.members.filter((m) => String(m.user?._id) !== String(userId)) });
            toast.success(isSelf ? 'You left the project' : 'Member removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <div style={{ maxWidth: 640 }}>

            {/* ── Owner row ── */}
            <div className="card mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="avatar avatar-lg"
                            style={{ background: `hsl(${(project.owner?.name?.charCodeAt(0) || 65) * 15}, 60%, 45%)` }}
                        >
                            {getInitials(project.owner?.name)}
                        </div>
                        <div>
                            <div className="font-bold">{project.owner?.name}</div>
                            <div className="text-xs text-muted">{project.owner?.email}</div>
                        </div>
                    </div>
                    <RoleBadge role="owner" />
                </div>
            </div>

            {/* ── Members list ── */}
            {(project.members || []).length === 0 && (
                <div className="card mb-3" style={{ textAlign: 'center', padding: '24px', color: 'var(--overlay1)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>👥</div>
                    <div className="text-sm">No members yet. Add collaborators below.</div>
                </div>
            )}

            {(project.members || []).map((m) => {
                if (!m.user) return null;
                const isSelf = String(m.user._id) === String(currentUserId);
                const canChangeRole = isOwner && !isSelf;
                const canRemove = isProjectAdmin || isSelf;

                return (
                    <div key={m.user._id} className="card mb-2">
                        <div className="flex items-center justify-between" style={{ gap: 12 }}>
                            {/* Avatar + name */}
                            <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    className="avatar"
                                    style={{ background: `hsl(${(m.user.name?.charCodeAt(0) || 65) * 15}, 60%, 45%)`, flexShrink: 0 }}
                                >
                                    {getInitials(m.user.name)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div className="font-bold truncate">
                                        {m.user.name}{isSelf && <span className="text-xs text-muted" style={{ marginLeft: 6 }}>(you)</span>}
                                    </div>
                                    <div className="text-xs text-muted truncate">{m.user.email}</div>
                                </div>
                            </div>

                            {/* Role control */}
                            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                                {canChangeRole ? (
                                    <select
                                        className="form-input"
                                        style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
                                        value={m.role}
                                        onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                ) : (
                                    <RoleBadge role={m.role} />
                                )}

                                {canRemove && (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleRemove(m.user._id)}
                                        title={isSelf ? 'Leave project' : 'Remove member'}
                                    >
                                        {isSelf ? 'Leave' : 'Remove'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* ── Add member form (admin/owner only) ── */}
            {isProjectAdmin && (
                <div className="card mt-4" style={{ background: 'var(--base)', border: '1px dashed var(--surface1)' }}>
                    <div className="section-title mb-3" style={{ fontSize: '0.95rem' }}>Add Member</div>

                    {inviteCandidates.length === 0 ? (
                        <p className="text-sm text-muted">All registered users are already in this project.</p>
                    ) : (
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                            <select
                                className="form-input flex-1"
                                style={{ minWidth: 180 }}
                                value={newUserId}
                                onChange={(e) => setNewUserId(e.target.value)}
                            >
                                <option value="">Select a user…</option>
                                {inviteCandidates.map((u) => (
                                    <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
                                ))}
                            </select>

                            <select
                                className="form-input"
                                style={{ width: 'auto' }}
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>

                            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !newUserId}>
                                {saving ? 'Adding…' : '+ Add'}
                            </button>
                        </div>
                    )}

                    <p className="text-xs text-muted mt-3">
                        <strong>Admin</strong> — can edit project, add/remove members, manage all tasks.<br />
                        <strong>Member</strong> — can view the project, create and update tasks.
                    </p>
                </div>
            )}
        </div>
    );
}
