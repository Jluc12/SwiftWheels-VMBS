CREATE DATABASE IF NOT EXISTS swiftwheels_vbms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE swiftwheels_vbms;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_name VARCHAR(100) NOT NULL,
  booking_date DATE NOT NULL,
  booking_duration INT NOT NULL,
  booking_cost DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'unpaid',
  payment_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT IGNORE INTO users (username, password, role) VALUES
('admin', '$2b$12$nTJgzlEUxlmdYa3H0qQ7SOsDRLxMfq98Whu4zVKqw4MBG5C9dLjPO', 'admin'),
('jluc', '$2b$12$oMO/iPAfOwVKNYax7/vsguLX.a8A9g45HAEAyuuXOIiUYXLpKQQsm', 'user');

INSERT IGNORE INTO customers (id, customer_name, phone_number, address) VALUES
(1, 'Jean Uwimana', '0782345678', 'Huye, Ngoma'),
(2, 'Aline Mukamana', '0791122334', 'Huye, Tumba'),
(3, 'Patrick Habimana', '0724567890', 'Kigali, Kicukiro'),
(4, 'Claudine Nyiransabimana', '0739876543', 'Nyanza, Busasamana'),
(5, 'Eric Ndayisaba', '0787654321', 'Muhanga, Nyamabuye');

INSERT IGNORE INTO bookings (id, customer_id, vehicle_name, booking_date, booking_duration, booking_cost, status) VALUES
(1, 1, 'Toyota Hiace', '2026-06-01', 2, 120000.00, 'confirmed'),
(2, 2, 'Coaster Bus', '2026-06-01', 1, 95000.00, 'completed'),
(3, 3, 'Toyota Rav4', '2026-06-02', 3, 180000.00, 'confirmed'),
(4, 4, 'Hyundai H1', '2026-06-03', 2, 140000.00, 'pending'),
(5, 5, 'Toyota Land Cruiser', '2026-06-04', 4, 320000.00, 'confirmed');

INSERT IGNORE INTO payments (id, booking_id, payment_amount, payment_status, payment_date) VALUES
(1, 1, 120000.00, 'paid', '2026-06-01'),
(2, 2, 95000.00, 'paid', '2026-06-01'),
(3, 3, 90000.00, 'partial', '2026-06-02'),
(4, 4, 0.00, 'unpaid', '2026-06-03'),
(5, 5, 320000.00, 'paid', '2026-06-04');
