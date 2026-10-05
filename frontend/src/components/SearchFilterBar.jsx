import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export const SearchFilterBar = ({
  filters,
  onFilterChange,
  members,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFieldChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleClear = () => {
    setSearchInput('');
    onFilterChange({
      search: '',
      status: '',
      priority: '',
      assigneeId: '',
      labels: '',
      dueDateBefore: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.assigneeId ||
    filters.labels ||
    filters.dueDateBefore
  );

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 mb-6 backdrop-blur">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        
        {/* Debounced Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={filters.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            aria-label="Filter by Status"
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            aria-label="Filter by Priority"
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            value={filters.assigneeId}
            onChange={(e) => handleFieldChange('assigneeId', e.target.value)}
            aria-label="Filter by Assignee"
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user?.name || m.user?.email || 'Member'}
              </option>
            ))}
          </select>

          <div className="relative flex items-center">
            <input
              type="date"
              value={filters.dueDateBefore}
              onChange={(e) => handleFieldChange('dueDateBefore', e.target.value)}
              title="Due before date"
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg px-2.5 py-2 text-xs font-medium flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
