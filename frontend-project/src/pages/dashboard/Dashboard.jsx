import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CalendarCheck, Car, CreditCard, Users } from 'lucide-react';
import { reportsAPI } from '../../services/reportsAPI.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cardClass, Spinner, StatusBadge } from '../../components/UI.jsx';

const colors = ['#ccfbf1', '#5eead4', '#14b8a6', '#0d9488', '#0f766e', '#134e4a'];
const icons = [Users, CalendarCheck, CreditCard, Car];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    reportsAPI.dashboard().then((response) => setData(response.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-6 mb-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {user?.username}!</h2>
          <p className="text-teal-200 mt-1">SwiftWheels VBMS - Management System</p>
        </div>
        <div className="text-sm text-teal-200">{new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {data.stats.map((stat, index) => {
          const Icon = icons[index];
          return (
            <div key={stat.label} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                </div>
                <span className={`w-11 h-11 rounded-xl grid place-items-center ${['bg-teal-100 text-teal-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'][index]}`}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardClass} p-6`}>
          <h3 className="font-bold text-slate-800 mb-4">Booking Status</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.chart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {data.chart.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #ccfbf1', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.chart.map((item, index) => <span key={item.name} className="text-sm text-slate-500"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: colors[index % colors.length] }} />{item.name}</span>)}
          </div>
        </div>
        <div className={`${cardClass} p-6 overflow-x-auto`}>
          <h3 className="font-bold text-slate-800 mb-4">Recent Bookings</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-teal-500/10 text-teal-700 text-xs uppercase"><th className="text-left p-3">Customer</th><th className="text-left p-3">Vehicle</th><th className="text-left p-3">Status</th></tr></thead>
            <tbody>{data.recent.map((row) => <tr key={row.id} className="border-b border-teal-50"><td className="p-3">{row.customer_name}</td><td className="p-3">{row.vehicle_name}</td><td className="p-3"><StatusBadge status={row.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
