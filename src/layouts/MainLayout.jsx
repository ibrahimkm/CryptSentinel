import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Topbar } from '../components/layout/Topbar.jsx';

export function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content-wrapper">
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
}
