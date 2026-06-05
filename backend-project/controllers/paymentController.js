import pool from '../config/db.js';

const getPaymentStatus = (amount, bookingCost) => {
  if (Number(amount) <= 0) return 'unpaid';
  if (Number(amount) >= Number(bookingCost)) return 'paid';
  return 'partial';
};

const validatePayment = ({ booking_id, payment_amount, payment_date }) => {
  const errors = {};
  if (!booking_id) errors.booking_id = 'Booking is required';
  if (Number(payment_amount) < 0 || payment_amount === '') errors.payment_amount = 'Payment amount must be zero or greater';
  if (!payment_date) errors.payment_date = 'Payment date is required';
  return errors;
};

const isBookingFullyPaid = async (bookingId) => {
  const [[{ total_paid, booking_cost }]] = await pool.query(
    `SELECT COALESCE(SUM(p.payment_amount), 0) AS total_paid, b.booking_cost
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.id = ?
     GROUP BY b.id`,
    [bookingId]
  );
  return Number(total_paid) >= Number(booking_cost);
};

export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT p.*, b.vehicle_name, b.booking_cost, c.customer_name,
              (SELECT COALESCE(SUM(p2.payment_amount), 0) FROM payments p2 WHERE p2.booking_id = p.booking_id) AS total_paid
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id
       WHERE c.customer_name LIKE CONCAT('%', ?, '%')
          OR b.vehicle_name LIKE CONCAT('%', ?, '%')
          OR p.payment_status LIKE CONCAT('%', ?, '%')
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [search, search, search, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id
       WHERE c.customer_name LIKE CONCAT('%', ?, '%')
          OR b.vehicle_name LIKE CONCAT('%', ?, '%')
          OR p.payment_status LIKE CONCAT('%', ?, '%')`,
      [search, search, search]
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const payload = {
      booking_id: Number(req.body.booking_id),
      payment_amount: Number(req.body.payment_amount),
      payment_date: req.body.payment_date
    };
    const errors = validatePayment(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [bookings] = await pool.query('SELECT booking_cost FROM bookings WHERE id = ?', [payload.booking_id]);
    if (!bookings.length) return res.status(400).json({ success: false, errors: { booking_id: 'Booking does not exist' }, message: 'Validation failed' });
    if (await isBookingFullyPaid(payload.booking_id)) {
      return res.status(403).json({ success: false, message: 'Cannot add payment: this booking is already fully paid. Payments are read-only once a booking is completely paid.' });
    }
    payload.payment_status = getPaymentStatus(payload.payment_amount, bookings[0].booking_cost);
    const [result] = await pool.query('INSERT INTO payments SET ?', [payload]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...payload }, message: 'Payment created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT booking_id FROM payments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (await isBookingFullyPaid(existing.booking_id)) {
      return res.status(403).json({ success: false, message: 'Cannot update payment: this booking is already fully paid. Payments are read-only once a booking is completely paid.' });
    }
    const payload = {
      booking_id: Number(req.body.booking_id),
      payment_amount: Number(req.body.payment_amount),
      payment_date: req.body.payment_date
    };
    const errors = validatePayment(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [bookings] = await pool.query('SELECT booking_cost FROM bookings WHERE id = ?', [payload.booking_id]);
    if (!bookings.length) return res.status(400).json({ success: false, errors: { booking_id: 'Booking does not exist' }, message: 'Validation failed' });
    payload.payment_status = getPaymentStatus(payload.payment_amount, bookings[0].booking_cost);
    const [result] = await pool.query('UPDATE payments SET ? WHERE id = ?', [payload, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT booking_id FROM payments WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (!(await isBookingFullyPaid(existing.booking_id))) {
      return res.status(403).json({ success: false, message: 'Cannot delete payment: the booking is not yet fully paid. Only payments of completely paid bookings can be deleted.' });
    }
    const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
