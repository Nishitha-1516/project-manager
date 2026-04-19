import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function ConnectionBadge() {
  const { connected } = useSocket();

  return (
    <div
      title={connected ? 'Real-time updates active' : 'Reconnecting…'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: connected ? 'rgba(166,227,161,0.1)' : 'rgba(249,226,175,0.1)',
        border: `1px solid ${connected ? 'rgba(166,227,161,0.25)' : 'rgba(249,226,175,0.25)'}`,
        fontSize: '0.72rem',
        fontWeight: 600,
        color: connected ? 'var(--green)' : 'var(--yellow)',
        letterSpacing: '0.04em',
        userSelect: 'none',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: connected ? 'var(--green)' : 'var(--yellow)',
        animation: connected ? 'pulse 2s infinite' : 'none',
        flexShrink: 0,
      }} />
      {connected ? 'Live' : 'Reconnecting'}
    </div>
  );
}
