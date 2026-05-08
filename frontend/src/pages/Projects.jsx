import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare, Crown, X } from 'lucide-react';
import api from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = () => {
    api.get('/projects').then(r => {
      setProjects(r.data);
      setLoading(false);
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setFormLoading(true);
    setError('');
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} color="var(--text-muted)" />
          <p style={{ marginTop: 12 }}>No projects yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Create your first project to get started
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 20 }}>
            <Plus size={16} /> New Project
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,106,245,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--accent-dim)', border: '1px solid rgba(124,106,245,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FolderKanban size={18} color="var(--accent-light)" />
                  </div>
                  <span className={`badge badge-${p.my_role}`}>
                    {p.my_role === 'admin' && <Crown size={10} />}
                    {p.my_role}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{p.name}</h3>
                {p.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' }}>
                    {p.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14,
                  borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    <Users size={13} /> {p.member_count}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    <CheckSquare size={13} /> {p.task_count} tasks
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    by {p.admin_name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Create Project</h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', padding: 4
              }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && <div className="error-msg">{error}</div>}
              <div className="form-group">
                <label>Project Name *</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Website Redesign" autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional project description..." rows={3}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
