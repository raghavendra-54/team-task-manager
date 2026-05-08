import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Users, TrendingUp } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const { total_tasks = 0, by_status = {}, by_user = [], overdue_tasks = [], my_tasks = [] } = data || {};
  const todoCount = by_status.todo || 0;
  const inProgressCount = by_status.in_progress || 0;
  const doneCount = by_status.done || 0;
  const completionRate = total_tasks > 0 ? Math.round((doneCount / total_tasks) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Welcome back, {user.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon={<ListTodo size={20} />} label="Total Tasks" value={total_tasks} color="var(--accent)" />
        <StatCard icon={<AlertTriangle size={20} />} label="To Do" value={todoCount} color="var(--text-dim)" />
        <StatCard icon={<Clock size={20} />} label="In Progress" value={inProgressCount} color="var(--amber)" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={doneCount} color="var(--green)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Completion bar */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16 }}>Overall Progress</h3>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-light)' }}>{completionRate}%</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              background: 'linear-gradient(90deg, var(--accent), var(--cyan))',
              width: `${completionRate}%`, transition: 'width 1s ease'
            }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <StatusDot color="var(--text-muted)" label="To Do" count={todoCount} />
            <StatusDot color="var(--amber)" label="In Progress" count={inProgressCount} />
            <StatusDot color="var(--green)" label="Done" count={doneCount} />
          </div>
        </div>

        {/* Tasks per user */}
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color="var(--text-muted)" /> Tasks per Member
          </h3>
          {by_user.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No assigned tasks yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {by_user.slice(0, 5).map(u => (
                <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-dim)', border: '1px solid rgba(124,106,245,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0
                  }}>
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, 
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                    {u.task_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue tasks */}
      {overdue_tasks.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(248,113,113,0.25)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--red)" />
            <span style={{ color: 'var(--red)' }}>Overdue Tasks ({overdue_tasks.length})</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {overdue_tasks.slice(0, 5).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--red-dim)',
                border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {task.project_name} · Due {task.due_date}
                  </div>
                </div>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My tasks */}
      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>My Assigned Tasks</h3>
        {my_tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No tasks assigned to you yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {my_tasks.slice(0, 6).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg-hover)',
                border: '1px solid var(--border)', borderRadius: 8,
                transition: 'border-color 0.15s'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {task.project_name}{task.due_date ? ` · Due ${task.due_date}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function StatusDot({ color, label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{count}</span>
    </div>
  );
}
