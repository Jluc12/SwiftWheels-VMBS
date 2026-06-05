import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const [[customer]] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [user.id]);
    req.session.user = { id: user.id, username: user.username, role: user.role, customer_id: customer?.id || null };
    return res.json({ success: true, data: req.session.user, message: 'Login successful' });
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

export const getMe = (req, res) => {
  res.json({ success: true, data: req.session?.user || null });
};

export const register = async (req, res, next) => {
  try {
    const { username, password, role = 'user', customer_name, phone_number } = req.body;
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (!strongPassword.test(password || '')) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ characters with uppercase, lowercase and digit' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    if (role === 'admin') {
      const [adminRows] = await pool.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
      if (adminRows.length > 0) {
        return res.status(409).json({ success: false, message: 'Only one admin is allowed. Delete the existing admin first before registering a new one.' });
      }
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username.trim(), hash, role]);

    let customerId = null;
    if (role === 'user') {
      const name = customer_name || username.trim();
      const phone = phone_number || '';
      const [custResult] = await pool.query(
        'INSERT INTO customers (customer_name, phone_number, address, user_id) VALUES (?, ?, ?, ?)',
        [name, phone, '', result.insertId]
      );
      customerId = custResult.insertId;
    }

    req.session.user = { id: result.insertId, username: username.trim(), role, customer_id: customerId };
    return res.status(201).json({
      success: true,
      data: { id: result.insertId, username: username.trim(), role, customer_id: customerId },
      message: 'Account created successfully'
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { username, securityPhrase, newPassword } = req.body;
    const phrase = process.env.SECURITY_PHRASE;
    if (!username || !securityPhrase || !newPassword) {
      return res.status(400).json({ success: false, message: 'All reset fields are required' });
    }
    if (!phrase || securityPhrase !== phrase) {
      return res.status(403).json({ success: false, message: 'Invalid security phrase' });
    }
    if (!strongPassword.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be 8+ characters with uppercase, lowercase and digit' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE username = ?', [hash, username.trim()]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return next(error);
  }
};
