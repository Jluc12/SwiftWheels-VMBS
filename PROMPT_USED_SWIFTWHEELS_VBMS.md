# Prompt Used For SwiftWheels VBMS

Build a complete full-stack Vehicle Booking Management System for SwiftWheels, a transport company in Huye District, Southern Province of Rwanda.

Use this fixed stack:
- Backend: Node.js 18+, Express.js v5, ES Modules, MySQL 8+, mysql2/promise only, raw SQL only, express-session, bcryptjs, dotenv, cors, cookie-parser.
- Frontend: React 19, Vite 7, Tailwind CSS v3, Axios with `withCredentials: true`, react-router-dom v6, lucide-react icons only, sweetalert2 confirmations, react-hot-toast notifications, recharts dashboard chart.
- No ORM, no JWT, no callback mysql2, no hardcoded frontend records.

Scenario:
SwiftWheels manually manages customer details, vehicle bookings and payments. The system must manage:
- Customer: CustomerName, PhoneNumber, Address.
- Booking: VehicleName, BookingDate, BookingDuration, BookingCost.
- Payment: PaymentAmount, PaymentStatus, PaymentDate.

Relationships:
- One Customer can have many Bookings.
- One Booking can have many Payments.
- PaymentStatus is derived from PaymentAmount compared with BookingCost: `paid`, `partial`, or `unpaid`.

Required app:
- Folder: `Luc_RUGERO_JEAN_National_Practical_Exam_2026`.
- Subfolders: `backend-project`, `frontend-project`, and `database`.
- Session based login with encrypted passwords.
- Admin-only users page.
- Responsive sidebar/topbar/mobile navigation.
- Teal and slate design system only.
- CRUD pages for Customers, Bookings and Payments.
- Reports page with:
  - Daily booking report.
  - Booking payment report containing Customer name, Vehicle name, Payment Amount, Payment Date.
  - Search, date filter, newest/oldest sort, pagination, CSV export.
- Dashboard with 4 stats, donut chart and recent bookings.
- Landing page with inline login and password reset.
- Rwandan phone validation on customer phone fields.

Database deliverable:
- Generate `database/vbms_mysql_queries.sql` that can be pasted into phpMyAdmin to create the database, tables, foreign keys, encrypted users and demo data.
- Database name: `swiftwheels_vbms`.
- Default credentials:
  - admin / Admin@1234
  - jluc / User@1234

Known environment note:
MySQL CLI was not available on PATH and no local MySQL process was detected during generation, so connection testing must be done after starting MySQL/XAMPP and importing the SQL script in phpMyAdmin.
