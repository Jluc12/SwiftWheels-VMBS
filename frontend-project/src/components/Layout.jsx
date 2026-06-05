import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarCheck, Car, CreditCard, Home, LogOut, Menu, Users, UserRound, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Home },
  { to: '/app/bookings', label: 'Bookings', icon: Car },
  { to: '/app/payments', label: 'Payments', icon: CreditCard },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 }
];

export const AppFooter = () => (
  <footer className="border-t border-teal-100 bg-white/60 backdrop-blur-sm py-10 mt-auto w-full">
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="w-9 h-9 rounded-lg bg-teal-600 text-white grid place-items-center"><Car className="w-5 h-5" /></span>
          SwiftWheels VBMS
        </div>
        <p className="text-sm text-slate-400 mt-3">Vehicle booking and payment management for SwiftWheels.</p>
        <p className="text-sm text-slate-500 mt-3">RUGERO JEAN LUC | rugerojl@gmail.com | 0782345678</p>
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 mb-3">Quick Links</h4>
        <div className="grid gap-2 text-sm">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} className="text-slate-500 hover:text-teal-700">{item.label}</NavLink>)}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-teal-600" /> Powered by RUGERO JEAN LUC</h4>
        <p className="text-sm text-slate-400">(c) {new Date().getFullYear()} SwiftWheels VBMS. Built by RUGERO JEAN LUC. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = [...navItems, { to: '/app/customers', label: 'Customers' }, { to: '/app/users', label: 'Users' }].find((item) => location.pathname.startsWith(item.to))?.label || 'SwiftWheels';
  const items = user?.role === 'admin' ? [...navItems, { to: '/app/customers', label: 'Customers', icon: UserRound }, { to: '/app/users', label: 'Users', icon: Users }] : navItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <span className="w-10 h-10 rounded-xl bg-teal-600 grid place-items-center"><Car className="w-5 h-5" /></span>
          <div>
            <p className="font-bold">SwiftWheels</p>
            <p className="text-xs text-slate-400">VBMS</p>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${isActive ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-teal-300'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-sm font-semibold">{user?.username}</p>
          <p className="text-xs text-teal-300 mb-3">{user?.role}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-rose-400">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-xl border-b border-teal-100 sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Menu className="w-5 h-5 text-slate-500 md:hidden" />
            <h1 className="font-bold text-slate-800">{title}</h1>
          </div>
          <div className="text-sm text-slate-500">
            Welcome, <span className="font-bold text-slate-800">{user?.username}</span>
            <span className="ml-2 bg-teal-100 text-teal-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">{user?.role}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
        <AppFooter />
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-teal-100 flex items-center justify-around py-2">
        {items.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center text-xs gap-1 ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center text-xs gap-1 text-slate-400">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Layout;
