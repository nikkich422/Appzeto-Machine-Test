import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Layers,
  LogOut,
  Shield,
  Plus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationCenter } from './NotificationCenter.jsx';

export const Navbar = ({ onOpenMembers, onOpenCreateProject }) => {
  const { user, organizations, currentOrg, currentRole, setCurrentOrg, switchDemoUser, logout } = useAuth();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
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

  const demoUsers = [
    { email: 'owner@example.com', label: 'Rahul Sharma (Owner)', role: 'OWNER' },
    { email: 'admin@example.com', label: 'Priya Patel (Admin)', role: 'ADMIN' },
    { email: 'member@example.com', label: 'Amit Verma (Member)', role: 'MEMBER' },
    { email: 'viewer@example.com', label: 'Neha Singh (Viewer)', role: 'VIEWER' },
  ];

  return (
    <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: App Logo & Organization Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">Appzeto</span>
              <span className="text-[10px] text-sky-400 font-medium tracking-wide uppercase block -mt-1">Task Hub</span>
            </div>
          </div>

          {/* Org Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition"
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>{currentOrg?.name || 'Select Organization'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showOrgMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  Switch Organization
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrg(org);
                      setShowOrgMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700/50 transition ${
                      currentOrg?.id === org.id ? 'bg-sky-500/10 text-sky-400 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <span>{org.name}</span>
                    {getRoleBadge(org.userRole)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Org Role Badge */}
          {currentRole && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Role:</span>
              {getRoleBadge(currentRole)}
            </div>
          )}
        </div>

        {/* Right: Quick Demo Persona Switcher, Actions, Notifications, User */}
        <div className="flex items-center gap-3">
          
          {/* Quick Demo Role Switcher */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 gap-1">
            <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-400" /> Switch Role:
            </span>
            {demoUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => switchDemoUser(u.email)}
                className={`text-xs px-2.5 py-1 rounded transition font-medium ${
                  user?.email === u.email
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Login as ${u.label}`}
              >
                {u.role}
              </button>
            ))}
          </div>

          {/* Org Members Button */}
          <button
            onClick={onOpenMembers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium border border-slate-700/70"
            title="Manage Members"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Members</span>
          </button>

          {/* Add Project Button (ADMIN/OWNER only) */}
          {(currentRole === 'OWNER' || currentRole === 'ADMIN') && (
            <button
              onClick={onOpenCreateProject}
              className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1 text-xs font-medium shadow-sm"
              title="New Project"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Project</span>
            </button>
          )}

          {/* Notifications Bell */}
          <NotificationCenter />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-700/50 transition focus:outline-none"
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff`}
                alt={user?.name}
                className="w-8 h-8 rounded-full border border-slate-600 object-cover"
              />
              <span className="text-sm font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3.5 py-2 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="px-2 py-1 lg:hidden border-b border-slate-700">
                  <p className="text-[11px] text-slate-400 px-2 py-1">Quick Switch User:</p>
                  {demoUsers.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => {
                        switchDemoUser(u.email);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 rounded"
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3.5 py-2 text-sm text-rose-400 hover:bg-slate-700/60 flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
