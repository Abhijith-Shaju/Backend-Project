import React from 'react';
import { Mail, Shield, UserRound, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-slate-400">Your account and logistics workspace access</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-3xl font-bold text-primary-400">
            {initials || <UserRound className="h-10 w-10" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name || 'LogiFlow User'}</h2>
            <p className="mt-1 text-slate-400">{user?.role || 'MANAGER'} account</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="font-medium text-white">{user?.email || 'Not available'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Shield className="h-4 w-4" />
              Role
            </div>
            <p className="font-medium text-white">{user?.role || 'MANAGER'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <UserRound className="h-4 w-4" />
              User ID
            </div>
            <p className="break-all font-medium text-white">{user?.id || 'Local session'}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <CalendarDays className="h-4 w-4" />
              Session
            </div>
            <p className="font-medium text-white">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
