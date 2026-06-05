import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from '../config/db.js';
import { initializeDatabase } from './initDB.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

const customers = [
  ['Jean Uwimana', '0782345678', 'Huye, Ngoma'],
  ['Aline Mukamana', '0791122334', 'Huye, Tumba'],
  ['Patrick Habimana', '0724567890', 'Kigali, Kicukiro'],
  ['Claudine Nyiransabimana', '0739876543', 'Nyanza, Busasamana'],
  ['Eric Ndayisaba', '0787654321', 'Muhanga, Nyamabuye'],
  ['Diane Iradukunda', '0793344556', 'Huye, Butare'],
  ['Emmanuel Tuyisenge', '0727788990', 'Gisagara, Save'],
  ['Vestine Uwamahoro', '0731234567', 'Musanze, Muhoza'],
  ['Olivier Manirakiza', '0789988776', 'Rubavu, Gisenyi'],
  ['Grace Ineza', '0795566778', 'Kigali, Gasabo'],
  ['Samuel Nkurunziza', '0723344556', 'Karongi, Bwishyura'],
  ['Beatrice Mukeshimana', '0736677889', 'Nyamagabe, Gasaka'],
  ['Claude Mugisha', '0784455667', 'Huye, Maraba'],
  ['Jeanne Mukandayisenga', '0798877665', 'Rusizi, Kamembe'],
  ['Aimable Habyarimana', '0729911223', 'Ruhango, Kinazi']
];

const vehicles = [
  'Toyota Hiace', 'Coaster Bus', 'Toyota Rav4', 'Hyundai H1', 'Toyota Land Cruiser',
  'Nissan Civilian', 'Suzuki Swift', 'Toyota Corolla', 'Mitsubishi Fuso', 'Toyota Prado',
  'Isuzu Elf', 'Toyota Quantum', 'Kia Sportage', 'Mazda Demio', 'Mercedes Sprinter'
];

const main = async () => {
  await initializeDatabase();

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const userHash = await bcrypt.hash('User@1234', 12);
  await pool.query('INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', adminHash, 'admin']);
  await pool.query('INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)', ['jluc', userHash, 'user']);

  for (const customer of customers) {
    await pool.query(
      'INSERT IGNORE INTO customers (customer_name, phone_number, address) VALUES (?, ?, ?)',
      customer
    );
  }

  const [customerRows] = await pool.query('SELECT id FROM customers ORDER BY id LIMIT 15');
  for (let i = 0; i < customerRows.length; i += 1) {
    const duration = (i % 5) + 1;
    const cost = duration * (45000 + (i % 4) * 10000);
    const day = String((i % 25) + 1).padStart(2, '0');
    await pool.query(
      'INSERT INTO bookings (customer_id, vehicle_name, booking_date, booking_duration, booking_cost, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customerRows[i].id, vehicles[i], `2026-06-${day}`, duration, cost, i % 3 === 0 ? 'completed' : 'confirmed']
    );
  }

  const [bookingRows] = await pool.query('SELECT id, booking_cost FROM bookings ORDER BY id LIMIT 15');
  for (let i = 0; i < bookingRows.length; i += 1) {
    const amount = i % 4 === 0 ? Number(bookingRows[i].booking_cost) / 2 : Number(bookingRows[i].booking_cost);
    const status = amount >= Number(bookingRows[i].booking_cost) ? 'paid' : 'partial';
    const day = String((i % 25) + 1).padStart(2, '0');
    await pool.query(
      'INSERT INTO payments (booking_id, payment_amount, payment_status, payment_date) VALUES (?, ?, ?, ?)',
      [bookingRows[i].id, amount, status, `2026-06-${day}`]
    );
  }

  const phrase = process.env.SECURITY_PHRASE || crypto.randomBytes(6).toString('hex').toUpperCase();
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    const next = env.includes('SECURITY_PHRASE=')
      ? env.replace(/SECURITY_PHRASE=.*/g, `SECURITY_PHRASE=${phrase}`)
      : `${env.trim()}\nSECURITY_PHRASE=${phrase}\n`;
    fs.writeFileSync(envPath, next);
  }

  console.log('Seed completed successfully');
  console.log('Admin: admin / Admin@1234');
  console.log('User: jluc / User@1234');
  console.log(`Security phrase: ${phrase}`);
  await pool.end();
};

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
