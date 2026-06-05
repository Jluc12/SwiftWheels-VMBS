import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit2, Loader2, Lock, Trash2 } from 'lucide-react';
import { bookingsAPI } from '../../services/bookingsAPI.js';
import { paymentsAPI } from '../../services/paymentsAPI.js';
import Modal from '../../components/Modal.jsx';
import { cardClass, dangerButton, EmptyState, inputClass, PageHeader, Pagination, primaryButton, SearchBar, Spinner, StatusBadge } from '../../components/UI.jsx';

const emptyForm = { booking_id: '', payment_amount: 0, payment_date: '' };

const PaymentsPage = () => {
  const [rows, setRows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const isFullyPaid = (row) => Number(row.total_paid) >= Number(row.booking_cost);
  const canDelete = (row) => isFullyPaid(row);
  const canEdit = (row) => !isFullyPaid(row);

  const load = async (page = pagination.page) => {
    setLoading(true);
    const [paymentRes, bookingRes] = await Promise.all([paymentsAPI.list({ page, limit: 5, search }), bookingsAPI.list({ page: 1, limit: 100, search: '' })]);
    setRows(paymentRes.data.data);
    setPagination(paymentRes.data.pagination);
    setBookings(bookingRes.data.data);
    setLoading(false);
  };

  useEffect(() => { load(1); }, [search]);

  const validate = () => {
    const next = {};
    if (!form.booking_id) next.booking_id = 'Booking is required';
    if (Number(form.payment_amount) < 0) next.payment_amount = 'Payment amount must be zero or greater';
    if (!form.payment_date) next.payment_date = 'Payment date is required';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const openForm = (record = null) => {
    setEditing(record);
    setForm(record ? { booking_id: record.booking_id, payment_amount: record.payment_amount, payment_date: String(record.payment_date).slice(0, 10) } : emptyForm);
    setErrors({});
    setModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) await paymentsAPI.update(editing.id, form);
      else await paymentsAPI.create(form);
      toast.success(`Payment ${editing ? 'updated' : 'created'} successfully`);
      setModal(false);
      load();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record) => {
    if (!canDelete(record)) {
      toast.error('Cannot delete payment: the booking is not yet fully paid. Only payments of completely paid bookings can be deleted.');
      return;
    }
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete payment for "${record.customer_name}"? This cannot be undone.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await paymentsAPI.remove(record.id);
    toast.success('Payment deleted successfully');
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Payments" subtitle="Edit payments while booking is active. Delete only after a booking is fully paid." actionLabel="New Payment" onAction={() => openForm()} />
      <div className={`${cardClass} p-4 mb-5`}><SearchBar value={search} onChange={setSearch} placeholder="Search payments" /></div>
      {loading ? <Spinner /> : !rows.length ? <EmptyState /> : (
        <>
          <div className={`${cardClass} overflow-hidden hidden md:block`}>
            <table className="w-full text-sm">
              <thead><tr className="bg-teal-500/10 text-teal-700 text-xs uppercase"><th className="text-left p-3">Customer</th><th className="text-left p-3">Vehicle</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Date</th><th className="text-left p-3">Status</th><th className="text-left p-3">Paid vs Cost</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="hover:bg-teal-50/40 border-b border-teal-50 animate-slide-up"><td className="p-3">{row.customer_name}</td><td className="p-3">{row.vehicle_name}</td><td className="p-3 font-semibold">{Number(row.payment_amount).toLocaleString()} RWF</td><td className="p-3">{String(row.payment_date).slice(0, 10)}</td><td className="p-3"><StatusBadge status={row.payment_status} /></td><td className="p-3 text-xs"><span className="font-mono">{Number(row.total_paid).toLocaleString()} / {Number(row.booking_cost).toLocaleString()} RWF</span>{isFullyPaid(row) && <Lock className="w-3 h-3 inline ml-1 text-teal-600" />}</td><td className="p-3"><div className="flex justify-end gap-2">{canEdit(row) && <button onClick={() => openForm(row)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg" title="Edit payment"><Edit2 className="w-4 h-4" /></button>}{canDelete(row) && <button onClick={() => remove(row)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete payment"><Trash2 className="w-4 h-4" /></button>}{!canEdit(row) && !canDelete(row) && <span className="text-xs text-slate-400 italic">No actions</span>}</div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="md:hidden">{rows.map((row) => <div key={row.id} className={`${cardClass} p-4 mb-3`}><div className="flex justify-between gap-3"><div><p className="font-bold">{row.customer_name}</p><p className="text-sm text-slate-500">{row.vehicle_name}</p></div><StatusBadge status={row.payment_status} /></div><p className="mt-2 text-sm">{Number(row.payment_amount).toLocaleString()} RWF | {String(row.payment_date).slice(0, 10)}</p><p className="text-xs text-slate-400 mt-1">Paid: {Number(row.total_paid).toLocaleString()} / {Number(row.booking_cost).toLocaleString()} RWF</p><div className="grid grid-cols-2 gap-2 mt-3">{canEdit(row) && <button className={primaryButton} onClick={() => openForm(row)}>Edit</button>}{canDelete(row) && <button className={dangerButton} onClick={() => remove(row)}>Delete</button>}</div></div>)}</div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={load} />
        </>
      )}
      <Modal open={modal} title={editing ? 'Edit Payment' : 'New Payment'} onClose={() => setModal(false)}>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-medium">Booking<select className={inputClass} value={form.booking_id} onChange={(event) => setForm({ ...form, booking_id: event.target.value })}><option value="">Select booking</option>{bookings.map((item) => <option key={item.id} value={item.id}>{item.customer_name} - {item.vehicle_name} - {Number(item.booking_cost).toLocaleString()} RWF</option>)}</select>{errors.booking_id && <p className="text-xs text-rose-500">{errors.booking_id}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Payment Amount<input type="number" className={inputClass} value={form.payment_amount} onChange={(event) => setForm({ ...form, payment_amount: event.target.value })} />{errors.payment_amount && <p className="text-xs text-rose-500">{errors.payment_amount}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Payment Date<input type="date" className={inputClass} value={form.payment_date} onChange={(event) => setForm({ ...form, payment_date: event.target.value })} />{errors.payment_date && <p className="text-xs text-rose-500">{errors.payment_date}</p>}</label>
          <button className={primaryButton} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Payment</button>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
