import pool from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const [[customers]] = await pool.query('SELECT COUNT(*) AS total FROM customers');
    const [[bookings]] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(booking_cost),0) AS total_cost FROM bookings');
    const [[payments]] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(payment_amount),0) AS total_paid FROM payments');
    const [[pending]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE status IN ('pending','confirmed')");
    const [chart] = await pool.query('SELECT status AS name, COUNT(*) AS value FROM bookings GROUP BY status');
    const [recent] = await pool.query(
      `SELECT b.id, c.customer_name, b.vehicle_name, b.booking_date, b.booking_cost, b.status
       FROM bookings b JOIN customers c ON c.id = b.customer_id
       ORDER BY b.created_at DESC LIMIT 5`
    );
    res.json({
      success: true,
      data: {
        stats: [
          { label: 'Customers', value: customers.total },
          { label: 'Bookings', value: bookings.total },
          { label: 'Total Paid', value: Number(payments.total_paid) },
          { label: 'Active Bookings', value: pending.total }
        ],
        chart,
        recent,
        totals: { bookingCost: Number(bookings.total_cost), paymentCount: payments.total }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMainReport = async (req, res, next) => {
  try {
    const { from, to, search = '', sort = 'newest' } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const offset = (page - 1) * limit;
    const order = sort === 'oldest' ? 'ASC' : 'DESC';
    const params = [search, search];
    let dateSql = '';
    if (from) {
      dateSql += ' AND b.booking_date >= ?';
      params.push(from);
    }
    if (to) {
      dateSql += ' AND b.booking_date <= ?';
      params.push(to);
    }
    const whereSql = `(c.customer_name LIKE CONCAT('%', ?, '%') OR b.vehicle_name LIKE CONCAT('%', ?, '%'))${dateSql}`;
    const [rows] = await pool.query(
      `SELECT b.booking_date, c.customer_name, b.vehicle_name, b.booking_duration, b.booking_cost,
              COALESCE(p.payment_amount,0) AS payment_amount,
              COALESCE(p.payment_status,'unpaid') AS payment_status,
              p.payment_date
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE ${whereSql}
       ORDER BY b.booking_date ${order}, b.id ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM bookings b JOIN customers c ON c.id = b.customer_id
       WHERE ${whereSql}`,
      params
    );
    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS total_bookings,
              COALESCE(SUM(b.booking_cost),0) AS total_booking_cost,
              COALESCE(SUM(p.payment_amount),0) AS total_payment_amount
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE ${whereSql}`,
      params
    );
    res.json({ success: true, data: { rows, summary }, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const getDailyBookings = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.booking_date, COUNT(*) AS total_bookings, COALESCE(SUM(b.booking_cost),0) AS total_booking_cost
       FROM bookings b GROUP BY b.booking_date ORDER BY b.booking_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

export const getBookingPayments = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.customer_name, b.vehicle_name, p.payment_amount, p.payment_date
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id
       ORDER BY p.payment_date DESC, p.id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};
