import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { customersAPI } from '../../services/customersAPI.js';
import Modal from '../../components/Modal.jsx';
import { cardClass, dangerButton, EmptyState, inputClass, PageHeader, Pagination, primaryButton, SearchBar, Spinner } from '../../components/UI.jsx';

const emptyForm = { customer_name: '', phone_number: '', address: '' };
const RWANDAN_PHONE = /^(079|078|072|073)\d{7}$/;

const CustomersPage = () => {
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
    const { data } = await customersAPI.list({ page, limit: 5, search });
    setRows(data.data);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(1); }, [search]);

  const validate = () => {
    const next = {};
    if (!form.customer_name.trim() || form.customer_name.trim().length < 3) next.customer_name = 'Name must be at least 3 characters';
    if (!RWANDAN_PHONE.test(form.phone_number.trim())) next.phone_number = 'Phone must be a valid Rwandan number (078/079/072/073 + 7 digits)';
    if (!form.address.trim()) next.address = 'Address is required';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const openForm = (record = null) => {
    setEditing(record);
    setForm(record || emptyForm);
    setErrors({});
    setModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) await customersAPI.update(editing.id, form);
      else await customersAPI.create(form);
      toast.success(`Customer ${editing ? 'updated' : 'created'} successfully`);
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
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete "${record.customer_name}"? This cannot be undone.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await customersAPI.remove(record.id);
    toast.success('Customer deleted successfully');
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Customers" subtitle="Register customer name, phone number and address." actionLabel="New Customer" onAction={() => openForm()} />
      <div className={`${cardClass} p-4 mb-5`}><SearchBar value={search} onChange={setSearch} placeholder="Search customers" /></div>
      {loading ? <Spinner /> : !rows.length ? <EmptyState /> : (
        <>
          <div className={`${cardClass} overflow-hidden hidden md:block`}>
            <table className="w-full text-sm">
              <thead><tr className="bg-teal-500/10 text-teal-700 text-xs uppercase tracking-wider"><th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Address</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="hover:bg-teal-50/40 border-b border-teal-50 transition-colors animate-slide-up"><td className="p-3 font-semibold">{row.customer_name}</td><td className="p-3 font-mono text-teal-700">{row.phone_number}</td><td className="p-3">{row.address}</td><td className="p-3"><div className="flex justify-end gap-2"><button onClick={() => openForm(row)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => remove(row)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody>
            </table>
          </div>
          <div className="md:hidden">{rows.map((row) => <div key={row.id} className={`${cardClass} p-4 mb-3`}><p className="font-bold">{row.customer_name}</p><p className="font-mono text-teal-700">{row.phone_number}</p><p className="text-sm text-slate-500">{row.address}</p><div className="grid grid-cols-2 gap-2 mt-3"><button className={primaryButton} onClick={() => openForm(row)}>Edit</button><button className={dangerButton} onClick={() => remove(row)}>Delete</button></div></div>)}</div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={load} />
        </>
      )}
      <Modal open={modal} title={editing ? 'Edit Customer' : 'New Customer'} onClose={() => setModal(false)}>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1 text-sm font-medium">Customer Name<input className={inputClass} value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} />{errors.customer_name && <p className="text-xs text-rose-500">{errors.customer_name}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Phone Number<input className={inputClass} value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} placeholder="078XXXXXXX" />{errors.phone_number && <p className="text-xs text-rose-500">{errors.phone_number}</p>}</label>
          <label className="grid gap-1 text-sm font-medium">Address<input className={inputClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />{errors.address && <p className="text-xs text-rose-500">{errors.address}</p>}</label>
          <button className={primaryButton} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Customer</button>
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
