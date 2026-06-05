import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit2, KeyRound, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { usersAPI } from '../../services/usersAPI.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import { cardClass, dangerButton, EmptyState, inputClass, PageHeader, Pagination, primaryButton, SearchBar, Spinner, StatusBadge } from '../../components/UI.jsx';

const emptyForm = { username: '', password: '', role: 'user' };

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const existingAdmin = rows.find((r) => r.role === 'admin');
  const adminLocked = !editing && !!existingAdmin;
  const editingSelfAdmin = editing && editing.role === 'admin' && editing.id === currentUser?.id;
  const editingOtherAsAdmin = editing && form.role === 'admin' && editing.id !== existingAdmin?.id;
  const adminOptionDisabled = adminLocked || editingOtherAsAdmin;

  const load = async (page = pagination.page) => {
    setLoading(true);
    const { data } = await usersAPI.list({ page: page || 1, limit: 5, search });
    setRows(data.data);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => { load(1); }, [search]);

  const openForm = (record = null) => {
    setEditing(record);
    setForm(record ? { username: record.username, role: record.role, password: '' } : emptyForm);
    setModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) await usersAPI.update(editing.id, { username: form.username, role: form.role });
      else await usersAPI.create(form);
      toast.success(`User ${editing ? 'updated' : 'created'} successfully`);
      setModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (record) => {
    const result = await Swal.fire({ title: 'New password', input: 'password', inputPlaceholder: 'Strong password', showCancelButton: true, confirmButtonColor: '#0d9488' });
    if (!result.value) return;
    await usersAPI.resetPassword(record.id, result.value);
    toast.success('Password reset successfully');
  };

  const remove = async (record) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: `Delete "${record.username}"? This cannot be undone.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', cancelButtonColor: '#64748b', confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    await usersAPI.remove(record.id);
    toast.success('User deleted successfully');
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users" subtitle="Only one admin allowed. Delete the existing admin first to create a new one." actionLabel="New User" onAction={() => openForm()} />
      {existingAdmin && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Admin <strong>{existingAdmin.username}</strong> already exists. Delete them first to create a replacement admin.</span>
        </div>
      )}
      <div className={`${cardClass} p-4 mb-5`}><SearchBar value={search} onChange={setSearch} placeholder="Search users" /></div>
      {loading ? <Spinner /> : !rows.length ? <EmptyState /> : (
        <>
          <div className={`${cardClass} overflow-hidden`}>
            <table className="w-full text-sm">
              <thead><tr className="bg-teal-500/10 text-teal-700 text-xs uppercase"><th className="text-left p-3">Username</th><th className="text-left p-3">Role</th><th className="text-right p-3">Actions</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="hover:bg-teal-50/40 border-b border-teal-50"><td className="p-3 font-semibold">{row.username}</td><td className="p-3"><StatusBadge status={row.role} /></td><td className="p-3"><div className="flex justify-end gap-2"><button onClick={() => openForm(row)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => resetPassword(row)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><KeyRound className="w-4 h-4" /></button><button onClick={() => remove(row)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody>
            </table>
          </div>
          <Pagination page={pagination.page} total={pagination.total} limit={pagination.limit} onPage={load} />
        </>
      )}
      <Modal open={modal} title={editing ? 'Edit User' : 'New User'} onClose={() => setModal(false)}>
        <form onSubmit={submit} className="grid gap-4">
          {adminOptionDisabled && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              Only one admin allowed. Delete <strong>{existingAdmin?.username}</strong> first to promote or create a new admin.
            </p>
          )}
          <input className={inputClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Username" />
          {!editing && <input type="password" className={inputClass} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Strong password" />}
          <select className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="user">user</option>
            <option value="admin" disabled={adminOptionDisabled}>{adminOptionDisabled ? 'admin (locked)' : 'admin'}</option>
          </select>
          <button className={primaryButton} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save User</button>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
