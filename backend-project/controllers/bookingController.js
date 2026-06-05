import pool from '../config/db.js';

const validateBooking = ({ customer_id, vehicle_name, booking_date, booking_duration, booking_cost, status }) => {
  const errors = {};
  if (!customer_id) errors.customer_id = 'Customer is required';
  if (!vehicle_name || vehicle_name.trim().length < 3) errors.vehicle_name = 'Vehicle name is required';
  if (!booking_date) errors.booking_date = 'Booking date is required';
  if (!Number.isInteger(Number(booking_duration)) || Number(booking_duration) <= 0) errors.booking_duration = 'Duration must be a positive whole number';
  if (Number(booking_cost) < 0 || booking_cost === '') errors.booking_cost = 'Booking cost must be zero or greater';
  if (status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) errors.status = 'Invalid booking status';
  return errors;
};

export const listBookings = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT b.*, c.customer_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       WHERE b.vehicle_name LIKE CONCAT('%', ?, '%')
          OR c.customer_name LIKE CONCAT('%', ?, '%')
          OR b.status LIKE CONCAT('%', ?, '%')
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [search, search, search, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM bookings b JOIN customers c ON c.id = b.customer_id
       WHERE b.vehicle_name LIKE CONCAT('%', ?, '%')
          OR c.customer_name LIKE CONCAT('%', ?, '%')
          OR b.status LIKE CONCAT('%', ?, '%')`,
      [search, search, search]
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const payload = {
      customer_id: Number(req.body.customer_id),
      vehicle_name: req.body.vehicle_name?.trim(),
      booking_date: req.body.booking_date,
      booking_duration: Number(req.body.booking_duration),
      booking_cost: Number(req.body.booking_cost),
      status: req.body.status || 'pending'
    };
    const errors = validateBooking(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [result] = await pool.query('INSERT INTO bookings SET ?', [payload]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...payload }, message: 'Booking created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  try {
    const payload = {
      customer_id: Number(req.body.customer_id),
      vehicle_name: req.body.vehicle_name?.trim(),
      booking_date: req.body.booking_date,
      booking_duration: Number(req.body.booking_duration),
      booking_cost: Number(req.body.booking_cost),
      status: req.body.status || 'pending'
    };
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
    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};
