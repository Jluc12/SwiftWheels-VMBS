import { Loader2, Inbox, Plus, Search } from 'lucide-react';

export const cardClass = 'bg-white/80 backdrop-blur-xl rounded-xl border border-teal-100 shadow-lg shadow-teal-100/25';
export const inputClass = 'w-full border border-teal-100 rounded-lg px-4 py-2.5 bg-white/80 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 text-slate-800 placeholder:text-slate-300 transition-all';
export const primaryButton = 'bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 py-2 rounded-lg font-semibold shadow-teal-md transition-all duration-150 flex items-center justify-center gap-2';
export const secondaryButton = 'border border-teal-200 text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center justify-center gap-2';
export const dangerButton = 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center justify-center gap-2';

const STATUS_CLASSES = {
  active: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  paid: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  confirmed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  partial: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  cancelled: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  unpaid: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  user: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  admin: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200'
};

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-2 py-8 text-teal-700">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50">
    <Spinner label="Preparing SwiftWheels VBMS" />
  </div>
);

export const EmptyState = ({ title = 'No records found', subtitle = 'Create a record to see it here.' }) => (
  <div className={`${cardClass} p-8 text-center`}>
    <Inbox className="w-10 h-10 mx-auto text-teal-500 mb-3" />
    <h3 className="font-bold text-slate-800">{title}</h3>
    <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
  </div>
);

export const PageHeader = ({ title, subtitle, actionLabel, onAction }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
    {actionLabel && (
      <button onClick={onAction} className={primaryButton}>
        <Plus className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

export const StatusBadge = ({ status }) => {
  const key = String(status || 'inactive').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASSES[key] || STATUS_CLASSES.user}`}>
      {status || 'inactive'}
    </span>
  );
};

export const SearchBar = ({ value, onChange, placeholder = 'Search records' }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input className={`${inputClass} pl-10`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </div>
);

export const Pagination = ({ page, total, limit = 5, onPage }) => {
  const pages = Math.max(Math.ceil(total / limit), 1);
  const start = total ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm">
      <p className="text-slate-500">Showing {start}-{end} of {total} results</p>
      <div className="flex items-center gap-2">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="px-3 py-2 rounded-lg border border-teal-100 disabled:opacity-40">Prev</button>
        {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
          <button key={item} onClick={() => onPage(item)} className={`px-3 py-2 rounded-lg ${item === page ? 'bg-teal-600 text-white shadow-teal-sm' : 'bg-white/80 border border-teal-100 text-slate-600 hover:bg-teal-50'}`}>
            {item}
          </button>
        ))}
        <button disabled={page === pages} onClick={() => onPage(page + 1)} className="px-3 py-2 rounded-lg border border-teal-100 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};
