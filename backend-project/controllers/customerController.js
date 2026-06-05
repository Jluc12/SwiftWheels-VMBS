import pool from '../config/db.js';

const RWANDAN_PHONE = /^(079|078|072|073)\d{7}$/;
const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s\-']+$/;

const validateCustomer = ({ customer_name, phone_number, address }) => {
  const errors = {};
  if (!customer_name || customer_name.trim().length < 3 || !NAME_PATTERN.test(customer_name.trim())) {
    errors.customer_name = 'Customer name must contain letters only and be at least 3 characters';
  }
  if (!phone_number || !RWANDAN_PHONE.test(phone_number.trim())) {
    errors.phone_number = 'Phone must be a valid Rwandan number (078/079/072/073 + 7 digits)';
  }
  if (!address || address.trim().length < 3) {
    errors.address = 'Address is required';
  }
  return errors;
};

export const listCustomers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT * FROM customers
       WHERE customer_name LIKE CONCAT('%', ?, '%')
          OR phone_number LIKE CONCAT('%', ?, '%')
          OR address LIKE CONCAT('%', ?, '%')
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [search, search, search, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM customers
       WHERE customer_name LIKE CONCAT('%', ?, '%')
          OR phone_number LIKE CONCAT('%', ?, '%')
          OR address LIKE CONCAT('%', ?, '%')`,
      [search, search, search]
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const payload = {
      customer_name: req.body.customer_name?.trim(),
      phone_number: req.body.phone_number?.trim(),
      address: req.body.address?.trim()
    };
    const errors = validateCustomer(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [result] = await pool.query('INSERT INTO customers SET ?', [payload]);
    res.status(201).json({ success: true, data: { id: result.insertId, ...payload }, message: 'Customer created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const payload = {
      customer_name: req.body.customer_name?.trim(),
      phone_number: req.body.phone_number?.trim(),
      address: req.body.address?.trim()
    };
    const errors = validateCustomer(payload);
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Validation failed' });
    const [result] = await pool.query('UPDATE customers SET ? WHERE id = ?', [payload, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
