const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Helper to get membership
function getMembership(projectId, userId) {
  return db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, userId);
}

// GET /api/projects/:projectId/tasks - Get all tasks for a project
router.get('/projects/:projectId/tasks', auth, (req, res) => {
  const membership = getMembership(req.params.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this project' });

  try {
    const tasks = db.prepare(`
      SELECT t.*,
        u1.name as assigned_to_name,
        u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `).all(req.params.projectId);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks - Create task (admin only)
router.post('/projects/:projectId/tasks', auth, (req, res) => {
  const membership = getMembership(req.params.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this project' });
  if (membership.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { title, description, due_date, priority, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority))
    return res.status(400).json({ error: 'Priority must be low, medium, or high' });

  try {
    // Validate assigned_to is a project member
    if (assigned_to) {
      const assigneeMembership = getMembership(req.params.projectId, assigned_to);
      if (!assigneeMembership)
        return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, due_date, priority, status, project_id, assigned_to, created_by)
      VALUES (?, ?, ?, ?, 'todo', ?, ?, ?)
    `).run(
      title,
      description || '',
      due_date || null,
      priority || 'medium',
      req.params.projectId,
      assigned_to || null,
      req.user.id
    );

    const task = db.prepare(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/:id - Get a single task
router.get('/tasks/:id', auth, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = getMembership(task.project_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/tasks/:id', auth, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = getMembership(task.project_id, req.user.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });

    const { title, description, due_date, priority, status, assigned_to } = req.body;
    const validStatuses = ['todo', 'in_progress', 'done'];
    const validPriorities = ['low', 'medium', 'high'];

    if (status && !validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    if (priority && !validPriorities.includes(priority))
      return res.status(400).json({ error: 'Invalid priority' });

    // Members can only update status of their own tasks
    if (membership.role === 'member') {
      if (task.assigned_to !== req.user.id)
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });

      // Members can only change status
      db.prepare(`
        UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(status || task.status, req.params.id);
    } else {
      // Admin can update everything
      if (assigned_to) {
        const assigneeMembership = getMembership(task.project_id, assigned_to);
        if (!assigneeMembership)
          return res.status(400).json({ error: 'Assigned user is not a project member' });
      }

      db.prepare(`
        UPDATE tasks 
        SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title || task.title,
        description !== undefined ? description : task.description,
        due_date !== undefined ? due_date : task.due_date,
        priority || task.priority,
        status || task.status,
        assigned_to !== undefined ? assigned_to : task.assigned_to,
        req.params.id
      );
    }

    const updated = db.prepare(`
      SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/tasks/:id', auth, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = getMembership(task.project_id, req.user.id);
    if (!membership || membership.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard - Dashboard stats for current user
router.get('/dashboard', auth, (req, res) => {
  try {
    // Get all project IDs the user is in
    const userProjects = db.prepare(
      'SELECT project_id FROM project_members WHERE user_id = ?'
    ).all(req.user.id).map(p => p.project_id);

    if (userProjects.length === 0) {
      return res.json({
        total_tasks: 0,
        by_status: { todo: 0, in_progress: 0, done: 0 },
        by_user: [],
        overdue_tasks: [],
        my_tasks: []
      });
    }

    const placeholders = userProjects.map(() => '?').join(',');

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`
    ).get(...userProjects);

    const byStatus = db.prepare(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`
    ).all(...userProjects);

    const byUser = db.prepare(`
      SELECT u.name, COUNT(t.id) as task_count
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
      GROUP BY t.assigned_to
    `).all(...userProjects);

    const today = new Date().toISOString().split('T')[0];
    const overdue = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id IN (${placeholders})
        AND t.due_date < ?
        AND t.status != 'done'
      ORDER BY t.due_date ASC
    `).all(...userProjects, today);

    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ?
      ORDER BY t.due_date ASC
    `).all(req.user.id);

    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    byStatus.forEach(s => { statusMap[s.status] = s.count; });

    res.json({
      total_tasks: total.count,
      by_status: statusMap,
      by_user: byUser,
      overdue_tasks: overdue,
      my_tasks: myTasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
