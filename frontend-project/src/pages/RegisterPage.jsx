import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Car, Eye, EyeOff, Lock, Phone, ShieldCheck, User, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AppFooter } from '../components/Layout.jsx';
import { cardClass, inputClass, primaryButton, secondaryButton } from '../components/UI.jsx';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'user', customer_name: '', phone_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const submitRegister = async (event) => {
    event.preventDefault();
    if (form.username.trim().length < 3) return toast.error('Username must be at least 3 characters');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.role === 'user') {
      if (!form.customer_name.trim()) return toast.error('Full name is required for user registration');
      if (!form.phone_number.trim()) return toast.error('Phone number is required for user registration');
    }
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        customer_name: form.customer_name.trim(),
        phone_number: form.phone_number.trim()
      });
      toast.success('Account created successfully');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-teal-100 h-16 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 font-bold text-slate-800">
          <span className="w-10 h-10 rounded-xl bg-teal-600 text-white grid place-items-center"><Car className="w-5 h-5" /></span>
          SwiftWheels VBMS
        </Link>
        <Link to="/" className={secondaryButton}><ArrowLeft className="w-4 h-4" /> Back</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className={`${cardClass} w-full max-w-md p-8 animate-slide-up`}>
          <div className="text-center mb-8">
            <span className="w-14 h-14 rounded-2xl bg-teal-600 text-white grid place-items-center mx-auto mb-4">
              <UserRound className="w-7 h-7" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-400 text-sm mt-1">Register to access SwiftWheels VBMS</p>
          </div>

          <form onSubmit={submitRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, role: 'user' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    form.role === 'user' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'
                  }`}
                ><User className="w-4 h-4" /> User</button>
                <button type="button" onClick={() => setForm({ ...form, role: 'admin' })}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    form.role === 'admin' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'
                  }`}
                ><ShieldCheck className="w-4 h-4" /> Admin</button>
              </div>
            </div>

            {form.role === 'admin' && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Only one admin is permitted. If an admin already exists, you must delete it first.</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input className={inputClass} value={form.username} onChange={handleChange('username')} placeholder="Choose a username" autoComplete="username" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-10 pr-12`} value={form.password} onChange={handleChange('password')} placeholder="Min 8 chars, upper, lower, digit" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Must be 8+ characters with uppercase, lowercase, and a digit.</p>
            </div>

            {form.role === 'user' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input className={inputClass} value={form.customer_name} onChange={handleChange('customer_name')} placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className={`${inputClass} pl-10`} value={form.phone_number} onChange={handleChange('phone_number')} placeholder="e.g. 0781234567" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">You will be registered as a customer and can create bookings.</p>
                </div>
              </>
            )}

            <button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
              {submitting ? 'Creating account...' : `Register as ${form.role === 'admin' ? 'Admin' : 'User'}`}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/" className="text-teal-600 hover:text-teal-800 font-semibold">Sign In</Link>
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default RegisterPage;
