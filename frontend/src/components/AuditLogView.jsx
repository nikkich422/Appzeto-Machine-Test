import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const AuditLogView = ({ members }) => {
  const { currentOrg, currentRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isAuthorized = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const fetchLogs = async (page = 1) => {
    if (!currentOrg?.id || !isAuthorized) return;
    try {
      setIsLoading(true);
      const res = await api.getAuditLogs({
        organizationId: currentOrg.id,
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        userId: userFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs(1);
    }
  }, [currentOrg?.id, entityFilter, actionFilter, userFilter, startDate, endDate, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
        <p className="text-slate-400 text-sm">
          Audit logs contain compliance records. Only organization <span className="text-purple-400 font-semibold">OWNER</span> and <span className="text-emerald-400 font-semibold">ADMIN</span> roles have access to view this page.
        </p>
      </div>
    );
  }

  const formatValue = (val) => {
    if (!val) return <span className="text-slate-500 italic">None</span>;
    try {
      const parsed = JSON.parse(val);
      return (
        <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300">
          {Object.entries(parsed)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')}
        </span>
      );
    } catch {
      return <span className="font-mono text-xs">{val}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white">Audit Log & Compliance Trail</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
            {pagination.total} records
          </span>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 backdrop-blur flex flex-wrap gap-2.5 items-center">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          aria-label="Filter by Entity"
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Entities</option>
          <option value="Task">Task</option>
          <option value="Project">Project</option>
          <option value="Member">Member</option>
          <option value="Organization">Organization</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter by Action"
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Actions</option>
          <option value="TASK_CREATE">TASK_CREATE</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE</option>
          <option value="ASSIGN_CHANGE">ASSIGN_CHANGE</option>
          <option value="PRIORITY_CHANGE">PRIORITY_CHANGE</option>
          <option value="TASK_DELETE">TASK_DELETE</option>
          <option value="MEMBER_ADD">MEMBER_ADD</option>
          <option value="MEMBER_REMOVE">MEMBER_REMOVE</option>
          <option value="PROJECT_CREATE">PROJECT_CREATE</option>
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          aria-label="Filter by User"
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Users</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user?.name || m.user?.email || 'Member'}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date filter"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
          />
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date filter"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
          />
        </div>

        {(entityFilter || actionFilter || userFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setEntityFilter('');
              setActionFilter('');
              setUserFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="bg-slate-850 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Old Value</th>
                <th className="px-4 py-3">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.user ? (
                          <>
                            <img
                              src={log.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user.name)}&background=0284c7&color=fff`}
                              alt={log.user.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-medium text-slate-200">{log.user.name}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">System</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-medium">{log.entity}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[100px]">
                        {log.entityId}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">{formatValue(log.oldValue)}</td>
                    <td className="px-4 py-3 max-w-xs">{formatValue(log.newValue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
