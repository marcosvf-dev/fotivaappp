import React from 'react';
import Sidebar from './Sidebar';
import VoiceChatbot from './VoiceChatbot';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </div>

      {/* Voice Chatbot */}
      <VoiceChatbot />
    </div>
  );
};

export default DashboardLayout;
