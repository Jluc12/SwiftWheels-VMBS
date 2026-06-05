import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { bookingsAPI } from '../../services/bookingsAPI.js';
import { customersAPI } from '../../services/customersAPI.js';
import Modal from '../../components/Modal.jsx';
import { cardClass, dangerButton, EmptyState, inputClass, PageHeader, Pagination, primaryButton, SearchBar, Spinner, StatusBadge } from '../../components/UI.jsx';

const emptyForm = { customer_id: '', vehicle_name: '', booking_date: '', booking_duration: 1, booking_cost: 0, status: 'pending' };

const BookingsPage = () => {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const load = async (page = pagination.page) => {
    setLoading(true);
    const [bookingRes, customerRes] = await Promise.all([bookingsAPI.list({ page, limit: 5, search }), customersAPI.list({ page: 1, limit: 100, search: '' })]);
    setRows(bookingRes.data.data);
    setPagination(bookingRes.data.pagination);
    setCustomers(customerRes.data.data);
    setLoading(false);
  };

  useEffect(() => { load(1); }, [search]);

  const validate = () => {
    const next = {};
    if (!form.customer_id) next.customer_id = 'Customer is required';
    if (!form.vehicle_name.trim()) next.vehicle_name = 'Vehicle name is required';
    if (!form.booking_date) next.booking_date = 'Booking date is required';
    if (Number(form.booking_duration) <= 0) next.booking_duration = 'Duration must be positive';
    if (Number(form.booking_cost) < 0) next.booking_cost = 'Cost must be zero or greater';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const openForm = (record = null) => {
    setEditing(record);
    setForm(record ? { ...record, booking_date: String(record.booking_date).slice(0, 10) } : emptyForm);
    setErrors({});
    setModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) await bookingsAPI.update(editing.id, form);
      else await bookingsAPI.create(form);
      toast.success(`Booking ${editing ? 'updated' : 'created'} successfully`);
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
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete "${record.vehicle_name}" booking? This cannot be undone.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await bookingsAPI.remove(record.id);
    toast.success('Booking deleted successfully');
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Bookings" subtitle="Capture vehicle name, booking date, duration and cost." actionLabel="New Booking" onAction={() => openForm()} />
      <div className={`${cardClass} p-4 mb-5`}><SearchBar value={search} onChange={setSearch} placeholder="Search bookings" /></div>
      {loading ? <Spinner /> : !rows.length ? <EmptyState /> : (
        <>
          <div className={`${cardClass} overflow-hidden hidden md:block`}>
            <table className="w-full text-sm">
              <thead><tr className="bg-teal-500/10 text-teal-700 text-xs uppercase"><th className="text-left p-3">Customer</th><th className="text-left p-3">Vehicle</th><th className="text-left p-3">Date</th><th className="text-left p-3">Cost</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="hover:bg-teal-50/40 border-b border-teal-50 animate-slide-up"><td className="p-3">{row.customer_name}</td><td className="p-3 font-semibold">{row.vehicle_name}</td><td className="p-3">{String(row.booking_date).slice(0, 10)}</td><td className="p-3">{Number(row.booking_cost).toLocaleString()} RWF</td><td className="p-3"><StatusBadge status={row.status} /></td><td className="p-3"><div className="flex justify-end gap-2"><button onClick={() => openForm(row)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(row)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="md:hidden">{rows.map((row) => <div key={row.id} className={`${cardClass} p-4 mb-3`}><div className="flex justify-between gap-3"><div><p className="font-bold">{row.vehicle_name}</p><p className="text-sm text-slate-500">{row.customer_name}</p></div><StatusBadge status={row.status} /></div><p className="mt-2 text-sm">{String(row.booking_date).slice(0, 10)} | {Number(row.booking_cost).toLocaleString()} RWF</p><div className="grid grid-cols-2 gap-2 mt-3"><button className={primaryButton} onClick={() => openForm(row)}>Edit</button><button className={dangerButton} onClick={() => remove(row)}>Delete</button></div></div>)}</div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={load} />
        </>
      )}
      <Modal open={modal} title={editing ? 'Edit Booking' : 'New Booking'} onClose={() => setModal(false)}>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-medium">Customer<select className={inputClass} value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Select customer</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.customer_name}</option>)}</select>{errors.customer_id && <p className="text-xs text-rose-500">{errors.customer_id}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Vehicle Name<input className={inputClass} value={form.vehicle_name} onChange={(event) => setForm({ ...form, vehicle_name: event.target.value })} />{errors.vehicle_name && <p className="text-xs text-rose-500">{errors.vehicle_name}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Booking Date<input type="date" className={inputClass} value={form.booking_date} onChange={(event) => setForm({ ...form, booking_date: event.target.value })} />{errors.booking_date && <p className="text-xs text-rose-500">{errors.booking_date}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Duration Days<input type="number" className={inputClass} value={form.booking_duration} onChange={(event) => setForm({ ...form, booking_duration: event.target.value })} />{errors.booking_duration && <p className="text-xs text-rose-500">{errors.booking_duration}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Booking Cost<input type="number" className={inputClass} value={form.booking_cost} onChange={(event) => setForm({ ...form, booking_cost: event.target.value })} />{errors.booking_cost && <p className="text-xs text-rose-500">{errors.booking_cost}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Status<select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{['pending', 'confirmed', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <button className={`${primaryButton} md:col-span-2`} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Booking</button>
        </form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
