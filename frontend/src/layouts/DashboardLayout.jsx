import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Chatbot from '../components/Chatbot';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

export default DashboardLayout;
