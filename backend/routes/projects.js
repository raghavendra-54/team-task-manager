const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/projects - Get all projects for current user
router.get('/', auth, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.name as admin_name, pm.role as my_role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.admin_id = u.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - Create a project
router.post('/', auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  try {
    const result = db.prepare(
      'INSERT INTO projects (name, description, admin_id) VALUES (?, ?, ?)'
    ).run(name, description || '', req.user.id);

    // Creator becomes admin member
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id - Get a specific project
router.get('/:id', auth, (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });

    const project = db.prepare(`
      SELECT p.*, u.name as admin_name
      FROM projects p
      JOIN users u ON p.admin_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    res.json({ ...project, members, my_role: membership.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project (admin only)
router.put('/:id', auth, (req, res) => {
  const { name, description } = req.body;
  try {
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });

    db.prepare(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?'
    ).run(name, description, req.params.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', auth, (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add member (admin only)
router.post('/:id/members', auth, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });

    const userToAdd = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
    if (!userToAdd) return res.status(404).json({ error: 'User not found with that email' });

    const alreadyMember = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, userToAdd.id);
    if (alreadyMember) return res.status(409).json({ error: 'User is already a member' });

    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.id, userToAdd.id, 'member');

    res.status(201).json({ message: 'Member added', user: userToAdd });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member (admin only)
router.delete('/:id/members/:userId', auth, (req, res) => {
  try {
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!membership || membership.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });

    const project = db.prepare('SELECT admin_id FROM projects WHERE id = ?').get(req.params.id);
    if (project.admin_id == req.params.userId)
      return res.status(400).json({ error: 'Cannot remove the project admin' });

    db.prepare(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
    ).run(req.params.id, req.params.userId);

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
