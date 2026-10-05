import React, { useState } from 'react';
import { X, UserPlus, Trash2, Shield, Mail, AlertCircle, Check } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const MembersModal = ({
  isOpen,
  onClose,
  members,
  onMembersChanged,
}) => {
  const { currentOrg, currentRole, user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const canManageMembers = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim() || !currentOrg) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.addMember(currentOrg.id, email.trim(), role);
      setSuccessMsg(`Member ${email} added successfully!`);
      setEmail('');
      onMembersChanged();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId, memberEmail) => {
    if (!currentOrg || !window.confirm(`Are you sure you want to remove ${memberEmail}?`)) return;

    try {
      await api.removeMember(currentOrg.id, userId);
      onMembersChanged();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'OWNER':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-xs font-semibold">OWNER</span>;
      case 'ADMIN':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-semibold">ADMIN</span>;
      case 'MEMBER':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded text-xs font-semibold">MEMBER</span>;
      case 'VIEWER':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded text-xs font-semibold">VIEWER</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-850 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">
              {currentOrg?.name} • Members & Permissions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {canManageMembers ? (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-750">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-sky-400" /> Add Team Member
              </h4>

              {errorMsg && (
                <div className="bg-rose-500/10 border-l-4 border-rose-500 p-2.5 mb-3 rounded text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-2.5 mb-3 rounded text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" /> {successMsg}
                </div>
              )}

              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  aria-label="Select member role"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-500"
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  {currentRole === 'OWNER' && <option value="OWNER">OWNER</option>}
                </select>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              You have {currentRole} access. Only ADMIN and OWNER can add or remove members.
            </p>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Current Members ({members.length})
            </h4>

            <div className="divide-y divide-slate-800">
              {members.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.name || 'User')}&background=0284c7&color=fff`}
                      alt={m.user?.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{m.user?.name || 'User'}</span>
                        {m.userId === user?.id && (
                          <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{m.user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getRoleBadge(m.role)}

                    {canManageMembers && m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.userId, m.user?.email)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
