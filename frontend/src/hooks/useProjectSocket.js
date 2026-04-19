import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export function useProjectSocket(projectId, handlers = {}, currentUserId) {
  const { joinProject, leaveProject, on, off, connected } = useSocket();
  const h = useRef(handlers);
  useEffect(() => { h.current = handlers; });

  useEffect(() => {
    if (!projectId || !connected) return;

    joinProject(projectId);

    const wrap = (key) => (...args) => h.current[key]?.(...args);

    const onTaskCreated       = wrap('onTaskCreated');
    const onTaskUpdated       = wrap('onTaskUpdated');
    const onTaskDeleted       = wrap('onTaskDeleted');
    const onTaskStatusChanged = wrap('onTaskStatusChanged');
    const onProjectUpdated    = wrap('onProjectUpdated');

    const onProjectDeleted = (payload) => {
      toast('This project was deleted', { icon: '🗑️' });
      h.current.onProjectDeleted?.(payload);
    };

    const onMembersUpdated = (payload) => {
      if (payload.removedUserId && String(payload.removedUserId) === String(currentUserId)) {
        toast('You have been removed from this project', { icon: '🚫' });
      }
      h.current.onMembersUpdated?.(payload);
    };

    on('task:created',            onTaskCreated);
    on('task:updated',            onTaskUpdated);
    on('task:deleted',            onTaskDeleted);
    on('task:status_changed',     onTaskStatusChanged);
    on('project:updated',         onProjectUpdated);
    on('project:deleted',         onProjectDeleted);
    on('project:members_updated', onMembersUpdated);

    return () => {
      off('task:created',            onTaskCreated);
      off('task:updated',            onTaskUpdated);
      off('task:deleted',            onTaskDeleted);
      off('task:status_changed',     onTaskStatusChanged);
      off('project:updated',         onProjectUpdated);
      off('project:deleted',         onProjectDeleted);
      off('project:members_updated', onMembersUpdated);
      leaveProject(projectId);
    };
  }, [projectId, connected]); // eslint-disable-line react-hooks/exhaustive-deps
}