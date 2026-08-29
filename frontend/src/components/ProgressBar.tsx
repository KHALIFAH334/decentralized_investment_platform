import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Progress</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{safeProgress.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${safeProgress}%` }}></div>
      </div>
    </div>
  );
}
