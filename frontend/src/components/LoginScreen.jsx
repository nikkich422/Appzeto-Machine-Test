import React, { useState } from 'react';
import { Layers, Shield, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginScreen = () => {
  const { login, register, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { name: 'Rahul Sharma', role: 'OWNER', email: 'owner@example.com', desc: 'Full control of Company A', color: 'from-purple-600 to-indigo-600' },
    { name: 'Priya Patel', role: 'ADMIN', email: 'admin@example.com', desc: 'Can manage projects & members', color: 'from-emerald-600 to-teal-600' },
    { name: 'Amit Verma', role: 'MEMBER', email: 'member@example.com', desc: 'Can create & edit assigned tasks', color: 'from-sky-600 to-blue-600' },
    { name: 'Neha Singh', role: 'VIEWER', email: 'viewer@example.com', desc: 'Read-only access across the board', color: 'from-slate-600 to-zinc-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-sky-500/20 mb-3">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Appzeto Project Hub</h2>
        <p className="text-sm text-slate-400 mt-1">Multi-Tenant Collaboration & Kanban System (Pure JS MERN)</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-slate-855 border border-slate-700/80 rounded-2xl p-5 mb-6 backdrop-blur shadow-2xl bg-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Quick Test Personas (1-Click Login)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Select any role to test server-side permissions, real-time collaboration, and audit tracking immediately:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => switchDemoUser(acc.email)}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 p-3 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{acc.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded bg-gradient-to-r ${acc.color} text-white`}>
                      {acc.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{acc.desc}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-6 backdrop-blur">
          <div className="flex border-b border-slate-800 pb-3 mb-4 justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isRegister ? 'Create a New Account' : 'Or Sign In with Credentials'}
            </h4>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border-l-4 border-rose-500 p-3 mb-4 rounded text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-md shadow-sky-600/20 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Processing...' : isRegister ? 'Register & Enter' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
