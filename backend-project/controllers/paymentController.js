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
     FROM bookings b LEFT JOIN payments p ON p.booking_id = b.id WHERE b.id = ? GROUP BY b.id`,
    [bookingId]
  );
  return Number(total_paid) >= Number(booking_cost);
};

const getUserCustomerIds = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [userId]);
  return rows.map((r) => r.id);
};

export const listPayments = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const isAdmin = req.session.user.role === 'admin';
    let where = 'WHERE (c.customer_name LIKE CONCAT("%", ?, "%") OR b.vehicle_name LIKE CONCAT("%", ?, "%") OR p.payment_status LIKE CONCAT("%", ?, "%"))';
    const params = [search, search, search];
    if (!isAdmin) {
      const ids = await getUserCustomerIds(req.session.user.id);
      if (!ids.length) return res.json({ success: true, data: [], pagination: { page, limit, total: 0 } });
      where += ` AND b.customer_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }
    const [rows] = await pool.query(
      `SELECT p.*, b.vehicle_name, b.booking_cost, c.customer_name,
              (SELECT COALESCE(SUM(p2.payment_amount), 0) FROM payments p2 WHERE p2.booking_id = p.booking_id) AS total_paid
       FROM payments p JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id ${where}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM payments p
       JOIN bookings b ON b.id = p.booking_id JOIN customers c ON c.id = b.customer_id ${where}`,
      params
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

const getAvailableBookings = async (userId, isAdmin) => {
  if (isAdmin) {
    const [rows] = await pool.query(
      `SELECT b.id, c.customer_name, b.vehicle_name, b.booking_cost
       FROM bookings b JOIN customers c ON c.id = b.customer_id
       WHERE b.status IN ('confirmed','completed') ORDER BY b.created_at DESC`
    );
    return rows;
  }
  const ids = await getUserCustomerIds(userId);
  if (!ids.length) return [];
  const [rows] = await pool.query(
    `SELECT b.id, c.customer_name, b.vehicle_name, b.booking_cost
     FROM bookings b JOIN customers c ON c.id = b.customer_id
     WHERE b.customer_id IN (${ids.map(() => '?').join(',')}) AND b.status IN ('confirmed','completed')
     ORDER BY b.created_at DESC`,
    ids
  );
  return rows;
};

export const createPayment = async (req, res, next) => {
  try {
    const isAdmin = req.session.user.role === 'admin';
    const available = await getAvailableBookings(req.session.user.id, isAdmin);
    const validIds = available.map((b) => b.id);
    const bookingId = Number(req.body.booking_id);
    if (!validIds.includes(bookingId)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own confirmed bookings' });
    }
    const payload = {
      booking_id: bookingId,
      payment_amount: Number(req.body.payment_amount),
      payment_date: req.body.payment_date
    };
    const errors = validatePayment(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [bookings] = await pool.query('SELECT booking_cost FROM bookings WHERE id = ?', [payload.booking_id]);
    if (!bookings.length) return res.status(400).json({ success: false, errors: { booking_id: 'Booking does not exist' }, message: 'Validation failed' });
    if (await isBookingFullyPaid(payload.booking_id)) {
      return res.status(403).json({ success: false, message: 'This booking is already fully paid' });
    }
    payload.payment_status = getPaymentStatus(payload.payment_amount, bookings[0].booking_cost);
    const [result] = await pool.query('INSERT INTO payments SET ?', [payload]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...payload }, message: 'Payment recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT p.*, b.customer_id FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });
    const isAdmin = req.session.user.role === 'admin';
    if (!isAdmin) {
      const ids = await getUserCustomerIds(req.session.user.id);
      if (!ids.includes(existing.customer_id)) return res.status(403).json({ success: false, message: 'You can only edit your own payments' });
    }
    if (await isBookingFullyPaid(existing.booking_id)) {
      return res.status(403).json({ success: false, message: 'Cannot update payment: booking is already fully paid' });
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
    res.json({ success: true, message: 'Payment updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT p.*, b.customer_id FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });
    const isAdmin = req.session.user.role === 'admin';
    if (!isAdmin) {
      const ids = await getUserCustomerIds(req.session.user.id);
      if (!ids.includes(existing.customer_id)) return res.status(403).json({ success: false, message: 'You can only delete your own payments' });
    }
    if (!(await isBookingFullyPaid(existing.booking_id))) {
      return res.status(403).json({ success: false, message: 'Cannot delete: booking is not fully paid' });
    }
    const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
