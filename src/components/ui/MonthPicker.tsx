import { useState, useRef, useEffect } from 'react';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface MonthPickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function MonthPicker({ value, onChange, placeholder = '选择年月' }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value + '-01T00:00:00') : new Date();
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const display = value ? `${value.split('-')[0]}年${Number(value.split('-')[1])}月` : '';

  const selectMonth = (month: number) => {
    onChange(`${viewYear}-${String(month).padStart(2, '0')}`);
    setOpen(false);
  };

  const changeYear = (delta: number) => {
    setViewYear((y) => y + delta);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-neutral-700 ${
          open ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-slate-300 hover:border-slate-400 dark:border-neutral-600 dark:hover:border-neutral-500'
        } ${display ? 'text-slate-900 dark:text-neutral-100' : 'text-slate-400'}`}
      >
        <span>{display || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg p-3 animate-fade-in dark:bg-neutral-800 dark:border-neutral-700">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => changeYear(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:bg-neutral-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">{viewYear} 年</span>
            <button
              type="button"
              onClick={() => changeYear(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:bg-neutral-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, idx) => {
              const monthVal = `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
              const isSelected = value === monthVal;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonth(idx + 1)}
                  className={`py-1.5 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
