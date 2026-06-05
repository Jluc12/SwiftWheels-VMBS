import pool from '../config/db.js';

const today = () => new Date().toISOString().slice(0, 10);

const validateBooking = ({ vehicle_name, booking_date, booking_duration, booking_cost }) => {
  const errors = {};
  if (!vehicle_name || vehicle_name.trim().length < 3) errors.vehicle_name = 'Vehicle name is required';
  if (!booking_date) errors.booking_date = 'Booking date is required';
  else if (booking_date < today()) errors.booking_date = 'Booking date cannot be in the past';
  if (!Number.isInteger(Number(booking_duration)) || Number(booking_duration) <= 0) errors.booking_duration = 'Duration must be a positive whole number';
  if (Number(booking_cost) < 0 || booking_cost === '') errors.booking_cost = 'Booking cost must be zero or greater';
  return errors;
};

const getUserCustomerId = async (userId) => {
  const [[row]] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [userId]);
  return row?.id || null;
};

export const listBookings = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const isAdmin = req.session.user.role === 'admin';
    let where = 'WHERE (b.vehicle_name LIKE CONCAT("%", ?, "%") OR c.customer_name LIKE CONCAT("%", ?, "%") OR b.status LIKE CONCAT("%", ?, "%"))';
    const params = [search, search, search];
    if (!isAdmin) {
      const customerId = await getUserCustomerId(req.session.user.id);
      if (!customerId) return res.json({ success: true, data: [], pagination: { page, limit, total: 0 } });
      where += ' AND b.customer_id = ?';
      params.push(customerId);
    }
    const [rows] = await pool.query(
      `SELECT b.*, c.customer_name FROM bookings b
       JOIN customers c ON c.id = b.customer_id ${where}
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b
       JOIN customers c ON c.id = b.customer_id ${where}`,
      params
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const isAdmin = req.session.user.role === 'admin';
    let customerId = Number(req.body.customer_id);
    if (!isAdmin || !customerId) {
      customerId = await getUserCustomerId(req.session.user.id);
      if (!customerId) return res.status(400).json({ success: false, message: 'No customer profile linked to your account. Contact admin.' });
    }
    const payload = {
      customer_id: customerId,
      vehicle_name: req.body.vehicle_name?.trim(),
      booking_date: req.body.booking_date,
      booking_duration: Number(req.body.booking_duration),
      booking_cost: Number(req.body.booking_cost),
      status: 'pending'
    };
    const errors = validateBooking(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [result] = await pool.query('INSERT INTO bookings SET ?', [payload]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...payload }, message: 'Booking submitted for admin approval' });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isAdmin = req.session.user.role === 'admin';
    const customerId = await getUserCustomerId(req.session.user.id);

    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own bookings' });
    }

    let payload;
    if (isAdmin) {
      payload = {
        customer_id: Number(req.body.customer_id) || existing.customer_id,
        vehicle_name: req.body.vehicle_name?.trim() || existing.vehicle_name,
        booking_date: req.body.booking_date || existing.booking_date,
        booking_duration: Number(req.body.booking_duration) || existing.booking_duration,
        booking_cost: Number(req.body.booking_cost) || existing.booking_cost,
        status: req.body.status || existing.status
      };
    } else {
      payload = {
        vehicle_name: req.body.vehicle_name?.trim() || existing.vehicle_name,
        booking_date: req.body.booking_date || existing.booking_date,
        booking_duration: Number(req.body.booking_duration) || existing.booking_duration,
        booking_cost: Number(req.body.booking_cost) || existing.booking_cost
      };
    }
    const errors = validateBooking(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [result] = await pool.query('UPDATE bookings SET ? WHERE id = ?', [payload, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT id, customer_id FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isAdmin = req.session.user.role === 'admin';
    const customerId = await getUserCustomerId(req.session.user.id);
    if (!isAdmin && existing.customer_id !== customerId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own bookings' });
    }

    await pool.query('DELETE FROM payments WHERE booking_id = ?', [req.params.id]);
    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Booking and associated payments deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const approveBooking = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT id, status FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (existing.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bookings can be approved' });
    await pool.query(
      'UPDATE bookings SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['confirmed', req.session.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Booking approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT id, status FROM bookings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (existing.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bookings can be rejected' });
    await pool.query('DELETE FROM payments WHERE booking_id = ?', [req.params.id]);
    await pool.query(
      'UPDATE bookings SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['cancelled', req.session.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Booking rejected and payments removed' });
  } catch (error) {
    next(error);
  }
};
