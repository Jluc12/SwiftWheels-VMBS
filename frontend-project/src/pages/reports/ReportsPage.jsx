import { useEffect, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { reportsAPI } from '../../services/reportsAPI.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cardClass, inputClass, PageHeader, Pagination, primaryButton, secondaryButton, Spinner, StatusBadge } from '../../components/UI.jsx';

const exportCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [headers, ...data.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`))];
  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ReportsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filters, setFilters] = useState({ from: '', to: '', search: '', sort: 'newest', page: 1, limit: 5 });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [daily, setDaily] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = async (next = filters) => {
    setLoading(true);
    const [mainRes, dailyRes, paymentRes] = await Promise.all([
      reportsAPI.main(next), reportsAPI.dailyBookings(), reportsAPI.bookingPayments()
    ]);
    setRows(mainRes.data.data.rows);
    setSummary(mainRes.data.data.summary);
    setPagination(mainRes.data.pagination);
    setDaily(dailyRes.data.data);
    setPayments(paymentRes.data.data);
    setLoading(false);
  };

  useEffect(() => { load(filters); }, [filters]);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  const reset = () => setFilters({ from: '', to: '', search: '', sort: 'newest', page: 1, limit: 5 });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle={isAdmin ? 'System-wide booking and payment reports.' : `Your booking and payment activity, ${user?.username}.`}
      />
      <div className={`${cardClass} p-4 mb-5 grid md:grid-cols-6 gap-3`}>
        <input type="date" className={inputClass} value={filters.from} onChange={(event) => update('from', event.target.value)} />
        <input type="date" className={inputClass} value={filters.to} onChange={(event) => update('to', event.target.value)} />
        <input className={`${inputClass} md:col-span-2`} value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search customer or vehicle" />
        <select className={inputClass} value={filters.sort} onChange={(event) => update('sort', event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option></select>
        <button className={secondaryButton} onClick={reset}><RotateCcw className="w-4 h-4" /> Reset</button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 text-white">
              <p className="text-teal-100">Bookings</p>
              <p className="text-2xl font-bold">{summary.total_bookings || 0}</p>
            </div>
            <div className={`${cardClass} p-6`}>
              <p className="text-slate-400">Booking Cost</p>
              <p className="text-2xl font-bold">{Number(summary.total_booking_cost || 0).toLocaleString()} RWF</p>
            </div>
            <div className={`${cardClass} p-6`}>
              <p className="text-slate-400">Payment Amount</p>
              <p className="text-2xl font-bold">{Number(summary.total_payment_amount || 0).toLocaleString()} RWF</p>
            </div>
            <div className={`${cardClass} p-6`}>
              <p className="text-slate-400">Report Rows</p>
              <p className="text-2xl font-bold">{daily.length}</p>
            </div>
          </div>

          <div className={`${cardClass} p-4 mb-6 flex flex-wrap gap-3`}>
            <button className={primaryButton} onClick={() => exportCSV(rows, 'booking-report.csv')}>
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button className={secondaryButton} onClick={() => exportCSV(daily, 'daily-bookings.csv')}>
              <Download className="w-4 h-4" /> Daily Bookings CSV
            </button>
            <button className={secondaryButton} onClick={() => exportCSV(payments, 'payment-report.csv')}>
              <Download className="w-4 h-4" /> Payments CSV
            </button>
          </div>

          <div className={`${cardClass} overflow-hidden hidden md:block`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/10 text-teal-700 text-xs uppercase">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Vehicle</th>
                  <th className="text-left p-3">Cost</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-b border-teal-50 hover:bg-teal-50/40">
                    <td className="p-3">{String(row.booking_date).slice(0, 10)}</td>
                    <td className="p-3">{row.customer_name}</td>
                    <td className="p-3">{row.vehicle_name}</td>
                    <td className="p-3">{Number(row.booking_cost).toLocaleString()} RWF</td>
                    <td className="p-3">{Number(row.payment_amount).toLocaleString()} RWF</td>
                    <td className="p-3"><StatusBadge status={row.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-teal-50/50 font-semibold border-t-2 border-teal-200">
                  <td className="p-3" colSpan="3">Totals</td>
                  <td className="p-3">{Number(summary.total_booking_cost || 0).toLocaleString()} RWF</td>
                  <td className="p-3">{Number(summary.total_payment_amount || 0).toLocaleString()} RWF</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="md:hidden">
            {rows.map((row, index) => (
              <div key={index} className={`${cardClass} p-4 mb-3`}>
                <div className="flex justify-between">
                  <p className="font-bold">{row.customer_name}</p>
                  <StatusBadge status={row.payment_status} />
                </div>
                <p className="text-sm text-slate-500">{row.vehicle_name} | {String(row.booking_date).slice(0, 10)}</p>
                <p className="mt-2 font-semibold">{Number(row.payment_amount).toLocaleString()} RWF paid</p>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={(page) => update('page', page)} />

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <div className={`${cardClass} p-5 overflow-x-auto`}>
              <h3 className="font-bold mb-3">Daily Booking Summary</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-500/10 text-teal-700">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Bookings</th>
                    <th className="text-left p-2">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr key={row.booking_date} className="border-b border-teal-50">
                      <td className="p-2">{String(row.booking_date).slice(0, 10)}</td>
                      <td className="p-2">{row.total_bookings}</td>
                      <td className="p-2">{Number(row.total_booking_cost).toLocaleString()} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`${cardClass} p-5 overflow-x-auto`}>
              <h3 className="font-bold mb-3">Payment Report</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-500/10 text-teal-700">
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 8).map((row, index) => (
                    <tr key={index} className="border-b border-teal-50">
                      <td className="p-2">{row.customer_name}</td>
                      <td className="p-2">{row.vehicle_name}</td>
                      <td className="p-2">{Number(row.payment_amount).toLocaleString()} RWF</td>
                      <td className="p-2">{String(row.payment_date).slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
