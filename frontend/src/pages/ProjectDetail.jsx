import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, X, Users, CheckSquare, Crown, UserPlus,
  UserMinus, ChevronLeft, Edit2, Calendar, Flag
} from 'lucide-react';
import api from '../api';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState('');
  const [memberError, setMemberError] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
  const [taskError, setTaskError] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = project?.my_role === 'admin';

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title, description: task.description || '',
      due_date: task.due_date || '', priority: task.priority,
      assigned_to: task.assigned_to || '', status: task.status
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskError('');
    setTaskLoading(true);
    try {
      const payload = {
        ...taskForm,
        assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null
      };
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload);
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
      }
      setShowTaskModal(false);
      fetchAll();
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError(''); setMemberMsg('');
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberMsg(`${res.data.user.name} added successfully!`);
      setMemberEmail('');
      fetchAll();
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!project) return null;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/projects')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
          marginBottom: 12, padding: 0, transition: 'color 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={15} /> All Projects
        </button>

        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ fontSize: 24 }}>{project.name}</h1>
              <span className={`badge badge-${project.my_role}`}>
                {project.my_role === 'admin' && <Crown size={10} />}
                {project.my_role}
              </span>
            </div>
            {project.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{project.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <>
                <button className="btn btn-primary btn-sm" onClick={openCreateTask}>
                  <Plus size={14} /> New Task
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'To Do', count: todoTasks.length, color: 'var(--text-dim)' },
          { label: 'In Progress', count: inProgressTasks.length, color: 'var(--amber)' },
          { label: 'Done', count: doneTasks.length, color: 'var(--green)' },
          { label: 'Members', count: project.members?.length || 0, color: 'var(--accent-light)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '8px 16px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Syne' }}>{s.count}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={14} /> },
          { key: 'members', label: 'Members', icon: <Users size={14} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'transparent', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === tab.key ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: -1,
            transition: 'all 0.15s'
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 13,
                border: '1px solid var(--border-light)',
                background: filter === s ? 'var(--accent)' : 'var(--bg-hover)',
                color: filter === s ? 'white' : 'var(--text-dim)',
                cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s'
              }}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
                {s === 'all' && <span style={{ marginLeft: 6, opacity: 0.7 }}>({tasks.length})</span>}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <CheckSquare size={40} />
              <p style={{ marginTop: 12 }}>No tasks {filter !== 'all' ? `with status "${STATUS_LABELS[filter]}"` : ''}</p>
              {isAdmin && filter === 'all' && (
                <button className="btn btn-primary" onClick={openCreateTask} style={{ marginTop: 16 }}>
                  <Plus size={15} /> Create first task
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isAdmin={isAdmin}
                  currentUserId={currentUser.id}
                  members={project.members}
                  onStatusChange={handleStatusChange}
                  onEdit={openEditTask}
                  onDelete={() => setConfirmDelete(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Add Member</h3>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input"
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  style={{ flex: 1 }}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={15} /> Add
                </button>
              </form>
              {memberError && <div className="error-msg" style={{ marginTop: 10 }}>{memberError}</div>}
              {memberMsg && <div className="success-msg" style={{ marginTop: 10 }}>{memberMsg}</div>}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(project.members || []).map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent-dim)', border: '1px solid rgba(124,106,245,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0
                }}>
                  {m.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>
                  {m.role === 'admin' && <Crown size={10} />}
                  {m.role}
                </span>
                {isAdmin && m.role !== 'admin' && (
                  <button onClick={() => handleRemoveMember(m.id)} className="btn btn-danger btn-sm">
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{editTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {taskError && <div className="error-msg">{taskError}</div>}

              <div className="form-group">
                <label>Title *</label>
                <input className="input" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title" autoFocus />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="input" value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional description..." rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Due Date</label>
                  <input className="input" type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="input" value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {editTask && isAdmin && (
                <div className="form-group">
                  <label>Status</label>
                  <select className="input" value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              )}

              {isAdmin && (
                <div className="form-group">
                  <label>Assign To</label>
                  <select className="input" value={taskForm.assigned_to}
                    onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {(project.members || []).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskLoading}>
                  {taskLoading
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
                    : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <h3 style={{ marginBottom: 12 }}>Delete Task?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteTask(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, isAdmin, currentUserId, members, onStatusChange, onEdit, onDelete }) {
  const canEdit = isAdmin || task.assigned_to === currentUserId;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 0.15s', animation: 'fadeIn 0.2s ease'
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(248,113,113,0.4)' : 'var(--border-light)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(248,113,113,0.25)' : 'var(--border)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</span>
          <span className={`badge badge-${task.priority}`}>
            <Flag size={10} /> {task.priority}
          </span>
          {isOverdue && (
            <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>● OVERDUE</span>
          )}
        </div>
        {task.description && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {task.due_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: isOverdue ? 'var(--red)' : 'var(--text-muted)' }}>
              <Calendar size={11} /> {task.due_date}
            </span>
          )}
          {task.assigned_to_name && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              → {task.assigned_to_name}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {canEdit && (
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
              borderRadius: 8, padding: '5px 10px', color: 'var(--text)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans'
            }}
          >
            {Object.entries({ todo: 'To Do', in_progress: 'In Progress', done: 'Done' }).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        )}
        {!canEdit && <span className={`badge badge-${task.status}`}>
          {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
        </span>}

        {isAdmin && (
          <>
            <button onClick={() => onEdit(task)} style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
              borderRadius: 8, padding: '6px 8px', color: 'var(--text-dim)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            >
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(task.id)} style={{
              background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, padding: '6px 8px', color: 'var(--red)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s'
            }}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
