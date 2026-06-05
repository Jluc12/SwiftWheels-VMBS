import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const cleanUser = (user) => ({ id: user.id, username: user.username, role: user.role, created_at: user.created_at });

const adminExists = async (excludeId = null) => {
  const [rows] = await pool.query(
    excludeId ? 'SELECT id FROM users WHERE role = ? AND id != ? LIMIT 1' : 'SELECT id FROM users WHERE role = ? LIMIT 1',
    excludeId ? ['admin', excludeId] : ['admin']
  );
  return rows.length > 0;
};

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT id, username, role, created_at FROM users
       WHERE username LIKE CONCAT('%', ?, '%') OR role LIKE CONCAT('%', ?, '%')
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [search, search, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users
       WHERE username LIKE CONCAT('%', ?, '%') OR role LIKE CONCAT('%', ?, '%')`,
      [search, search]
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, password, role = 'user' } = req.body;
    if (!username || username.trim().length < 3) return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid user role' });
    if (!strongPassword.test(password || '')) return res.status(400).json({ success: false, message: 'Password must be 8+ characters with uppercase, lowercase and digit' });
    if (role === 'admin' && await adminExists()) {
      return res.status(409).json({ success: false, message: 'Only one admin is allowed. Delete the existing admin first before creating a new one.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username.trim(), hash, role]);
    res.status(201).json({ success: true, data: cleanUser({ id: result.insertId, username: username.trim(), role }), message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { username, role } = req.body;
    if (!username || username.trim().length < 3) return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid user role' });
    if (role === 'admin' && await adminExists(Number(req.params.id))) {
      return res.status(409).json({ success: false, message: 'Only one admin is allowed. Delete the existing admin first to replace them.' });
    }
    const [result] = await pool.query('UPDATE users SET username = ?, role = ? WHERE id = ?', [username.trim(), role, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!strongPassword.test(password || '')) return res.status(400).json({ success: false, message: 'Password must be 8+ characters with uppercase, lowercase and digit' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.session.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
