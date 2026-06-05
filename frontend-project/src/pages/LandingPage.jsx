import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, Car, CreditCard, Eye, EyeOff, Lock, ShieldCheck, UserRound, User } from 'lucide-react';
import { authAPI } from '../services/authAPI.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { AppFooter } from '../components/Layout.jsx';
import { cardClass, inputClass, primaryButton, secondaryButton } from '../components/UI.jsx';

const ROLE_CREDENTIALS = {
  admin: { username: 'admin', password: 'Admin@1234' },
  user: { username: 'jluc', password: 'User@1234' }
};

const LandingPage = () => {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ username: 'admin', password: 'Admin@1234', securityPhrase: '', newPassword: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const switchRole = (newRole) => {
    setRole(newRole);
    setForm({ ...form, ...ROLE_CREDENTIALS[newRole] });
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    try {
      const user = await login({ username: form.username, password: form.password });
      if (user.role !== role) {
        toast.error(`This account is registered as "${user.role}", not "${role}". Please select the correct role.`);
        return;
      }
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    try {
      await authAPI.resetPassword({ username: form.username, securityPhrase: form.securityPhrase, newPassword: form.newPassword });
      toast.success('Password reset successfully');
      setResetMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-teal-100 shadow-teal-sm h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3 font-bold text-slate-800">
          <span className="w-10 h-10 rounded-xl bg-teal-600 text-white grid place-items-center"><Car className="w-5 h-5" /></span>
          SwiftWheels VBMS
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className={secondaryButton}>Sign In</button>
          <Link to="/register" className={primaryButton}>Get Started</Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200 px-3 py-1 text-sm font-semibold">Huye District transport operations</span>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mt-5 leading-tight">Vehicle Booking <span className="text-teal-600">Management</span></h1>
            <p className="text-slate-500 mt-5 text-lg">Manage customers, vehicle bookings, payment tracking, daily booking reports, and booking payment reports from one responsive system.</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => setOpen(true)} className={primaryButton}>Open System</button>
              <Link to="/register" className={secondaryButton}>Create Account</Link>
            </div>
          </div>
          <div className={`${cardClass} p-8 animate-slide-up`}>
            <div className="grid grid-cols-2 gap-4">
              {[Car, CalendarCheck, UserRound, CreditCard].map((Icon, index) => (
                <div key={index} className="rounded-xl bg-teal-50 border border-teal-100 p-5 min-h-32 flex flex-col justify-between">
                  <Icon className="w-8 h-8 text-teal-600" />
                  <span className="font-semibold text-slate-800">{['Vehicles', 'Bookings', 'Customers', 'Payments'][index]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-8 my-10 grid md:grid-cols-3 gap-6">
            {['3 Core Entities', '2 Required Reports', 'Session Auth'].map((label, index) => (
              <div key={label} className="text-white">
                <ShieldCheck className="w-7 h-7 text-teal-200 mb-3" />
                <p className="text-2xl font-bold">{label.split(' ')[0]}</p>
                <p className="text-teal-100">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-5">
          {['Customer registration', 'Vehicle booking capture', 'Automatic payment status', 'Daily booking report', 'Booking payment report', 'CSV export'].map((feature) => (
            <div key={feature} className={`${cardClass} p-5 hover:-translate-y-1 transition-transform`}>
              <CalendarCheck className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-slate-800">{feature}</h3>
              <p className="text-sm text-slate-400 mt-2">Built for the SwiftWheels workflow described in the exam scenario.</p>
            </div>
          ))}
        </section>
      </main>
      <AppFooter />

      <Modal open={open} title={resetMode ? 'Reset Password' : 'Sign In'} onClose={() => setOpen(false)}>
        {!resetMode && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Signing in as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  role === 'admin'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Admin
              </button>
              <button
                type="button"
                onClick={() => switchRole('user')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  role === 'user'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'
                }`}
              >
                <User className="w-4 h-4" /> User
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {role === 'admin'
                ? 'Admin login — full system access including user and customer management.'
                : 'User login — manage bookings, payments, and reports.'}
            </p>
          </div>
        )}
        <form onSubmit={resetMode ? submitReset : submitLogin} className="space-y-4">
          <input className={inputClass} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder={`${role} username`} />
          {!resetMode && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-10 pr-12`} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={`${role} password`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          )}
          {resetMode && (
            <>
              <input className={inputClass} value={form.securityPhrase} onChange={(event) => setForm({ ...form, securityPhrase: event.target.value })} placeholder="Security phrase from seed output" />
              <input type="password" className={inputClass} value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="New strong password" />
            </>
          )}
          <button className={primaryButton} type="submit">{resetMode ? 'Reset Password' : `Sign In as ${role === 'admin' ? 'Admin' : 'User'}`}</button>
          {!resetMode && (
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setResetMode(!resetMode)} className="text-sm text-teal-700 hover:text-teal-900">
                Forgot password?
              </button>
              <Link to="/register" className="text-sm text-teal-700 hover:text-teal-900 font-semibold">
                Create account
              </Link>
            </div>
          )}
          {resetMode && (
            <button type="button" onClick={() => setResetMode(false)} className="text-sm text-teal-700 hover:text-teal-900 w-full text-center">
              Back to login
            </button>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default LandingPage;
