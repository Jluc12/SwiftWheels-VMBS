import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { CheckCircle, Edit2, Loader2, Trash2, XCircle } from 'lucide-react';
import { bookingsAPI } from '../../services/bookingsAPI.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import { cardClass, dangerButton, EmptyState, inputClass, PageHeader, Pagination, primaryButton, SearchBar, Spinner, StatusBadge } from '../../components/UI.jsx';

const emptyForm = { vehicle_name: '', booking_date: '', booking_duration: 1, booking_cost: 0 };

const BookingsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rows, setRows] = useState([]);
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
    const { data } = await bookingsAPI.list({ page, limit: 5, search });
    setRows(data.data);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(1); }, [search]);

  const validate = () => {
    const next = {};
    if (!form.vehicle_name.trim()) next.vehicle_name = 'Vehicle name is required';
    if (!form.booking_date) next.booking_date = 'Booking date is required';
    if (Number(form.booking_duration) <= 0) next.booking_duration = 'Duration must be positive';
    if (Number(form.booking_cost) < 0) next.booking_cost = 'Cost must be zero or greater';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const openForm = (record = null) => {
    setEditing(record);
    const f = record
      ? { vehicle_name: record.vehicle_name, booking_date: String(record.booking_date).slice(0, 10), booking_duration: record.booking_duration, booking_cost: record.booking_cost }
      : emptyForm;
    setForm(f);
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
      toast.success(editing ? 'Booking updated' : 'Booking submitted for admin approval');
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
    const result = await Swal.fire({
      title: 'Delete booking?',
      text: `"${record.vehicle_name}" — associated payments will also be deleted.`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete', cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    await bookingsAPI.remove(record.id);
    toast.success('Booking and payments deleted');
    load();
  };

  const approve = async (record) => {
    const result = await Swal.fire({ title: 'Approve booking?', text: `Confirm "${record.vehicle_name}" for ${record.customer_name}`, icon: 'question', showCancelButton: true, confirmButtonColor: '#0d9488', confirmButtonText: 'Approve', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await bookingsAPI.approve(record.id);
    toast.success('Booking approved');
    load();
  };

  const reject = async (record) => {
    const result = await Swal.fire({ title: 'Reject booking?', text: `"${record.vehicle_name}" will be cancelled and payments removed.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Reject', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await bookingsAPI.reject(record.id);
    toast.success('Booking rejected');
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bookings"
        subtitle={isAdmin ? 'Approve or reject pending bookings from users.' : 'Create a booking — admin must approve it first.'}
        actionLabel="New Booking"
        onAction={() => openForm()}
      />
      <div className={`${cardClass} p-4 mb-5`}><SearchBar value={search} onChange={setSearch} placeholder="Search bookings" /></div>
      {loading ? <Spinner /> : !rows.length ? <EmptyState /> : (
        <>
          <div className={`${cardClass} overflow-hidden hidden md:block`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-500/10 text-teal-700 text-xs uppercase">
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Vehicle</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Cost</th>
                  <th className="text-left p-3">Status</th>
                  {isAdmin && <th className="text-left p-3">Approve</th>}
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-teal-50/40 border-b border-teal-50 animate-slide-up">
                    <td className="p-3">{row.customer_name}</td>
                    <td className="p-3 font-semibold">{row.vehicle_name}</td>
                    <td className="p-3">{String(row.booking_date).slice(0, 10)}</td>
                    <td className="p-3">{Number(row.booking_cost).toLocaleString()} RWF</td>
                    <td className="p-3"><StatusBadge status={row.status} /></td>
                    {isAdmin && (
                      <td className="p-3">
                        {row.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => approve(row)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => reject(row)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : row.approved_by ? (
                          <span className="text-xs text-slate-400">Done</span>
                        ) : null}
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openForm(row)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => remove(row)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {rows.map((row) => (
              <div key={row.id} className={`${cardClass} p-4 mb-3`}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{row.vehicle_name}</p>
                    <p className="text-sm text-slate-500">{row.customer_name}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-2 text-sm">{String(row.booking_date).slice(0, 10)} | {Number(row.booking_cost).toLocaleString()} RWF</p>
                <div className="flex gap-2 mt-3">
                  {isAdmin && row.status === 'pending' && (
                    <>
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200" onClick={() => approve(row)}><CheckCircle className="w-4 h-4" /></button>
                      <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200" onClick={() => reject(row)}><XCircle className="w-4 h-4" /></button>
                    </>
                  )}
                  <button className={primaryButton} onClick={() => openForm(row)}>Edit</button>
                  <button className={dangerButton} onClick={() => remove(row)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={load} />
        </>
      )}

      <Modal open={modal} title={editing ? 'Edit Booking' : 'New Booking'} onClose={() => setModal(false)}>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <label className="md:col-span-2 grid gap-1 text-sm font-medium">
            Vehicle Name
            <input className={inputClass} value={form.vehicle_name} onChange={(event) => setForm({ ...form, vehicle_name: event.target.value })} placeholder="e.g. Toyota Hiace" />
            {errors.vehicle_name && <p className="text-xs text-rose-500">{errors.vehicle_name}</p>}
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Booking Date
            <input type="date" className={inputClass} value={form.booking_date} onChange={(event) => setForm({ ...form, booking_date: event.target.value })} />
            {errors.booking_date && <p className="text-xs text-rose-500">{errors.booking_date}</p>}
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Duration (days)
            <input type="number" className={inputClass} value={form.booking_duration} onChange={(event) => setForm({ ...form, booking_duration: Number(event.target.value) })} min="1" />
            {errors.booking_duration && <p className="text-xs text-rose-500">{errors.booking_duration}</p>}
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Booking Cost (RWF)
            <input type="number" className={inputClass} value={form.booking_cost} onChange={(event) => setForm({ ...form, booking_cost: Number(event.target.value) })} min="0" />
            {errors.booking_cost && <p className="text-xs text-rose-500">{errors.booking_cost}</p>}
          </label>
          <button className={`${primaryButton} md:col-span-2`} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Update Booking' : 'Submit Booking'}
          </button>
          {!editing && !isAdmin && (
            <p className="text-xs text-slate-400 md:col-span-2 text-center -mt-2">
              After submission, an admin must approve your booking.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
