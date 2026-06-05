# SwiftWheels VBMS - Built by RUGERO JEAN LUC
**Rwanda National Practical Examination 2026**

SwiftWheels VBMS manages customers, vehicle bookings, booking payments, daily booking reports, and booking payment reports for SwiftWheels in Huye District.

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js v5 |
| Database | MySQL 8+ with raw SQL |
| Driver | mysql2/promise |
| Frontend | React 19 + Vite 7 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Auth | express-session + bcryptjs |

## Database Setup
Open phpMyAdmin and paste the full script from:

`database/vbms_mysql_queries.sql`

It creates the `swiftwheels_vbms` database, all tables, relationships, encrypted default users, and demo data.

## Backend
```bash
cd backend-project
npm install
copy .env.example .env
```

Edit `.env` and set your MySQL password. Then run:

```bash
npm run seed
npm run dev
```

The backend starts on `http://localhost:5000`.

## Frontend
```bash
cd frontend-project
npm install
npm run dev
```

Open `http://localhost:5173`.

## Default Credentials
| Role | Username | Password |
|---|---|---|
| Admin | admin | Admin@1234 |
| User | jluc | User@1234 |

The seed command prints the generated security phrase used for password resets.

## Reports
- Daily booking report: booking date, total bookings, total booking cost
- Booking payment report: customer name, vehicle name, payment amount, payment date
- Main report: searchable, date-filtered, sortable, paginated, and exportable to CSV

## Contact
**RUGERO JEAN LUC** | rugerojl@gmail.com | 0782345678
