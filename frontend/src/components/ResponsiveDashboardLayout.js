import React from 'react';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';

const ResponsiveDashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveDashboardLayout;