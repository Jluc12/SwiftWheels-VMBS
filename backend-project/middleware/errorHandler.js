export const errorHandler = (error, req, res, next) => {
  if (error.code === 'ER_DUP_ENTRY') {
    const idx = error.sqlMessage?.includes('phone_number') ? 'phone_number' : '';
    if (idx === 'phone_number') {
      return res.status(409).json({ success: false, message: 'This phone number is already registered to another customer. Please use a different phone number.', errors: { phone_number: 'This phone number is already in use' } });
    }
    return res.status(409).json({ success: false, message: 'A record with the same unique value already exists' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'The selected related record does not exist' });
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ success: false, message: 'This record is in use and cannot be deleted' });
  }
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
  res.status(status).json({ success: false, message });
};

export default errorHandler;
