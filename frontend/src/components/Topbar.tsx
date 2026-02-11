import { Bell, LogOut } from 'lucide-react';

interface TopbarProps {
  onLogout: () => void;
  pageTitle?: string;
}

export default function Topbar({ onLogout, pageTitle = 'Dashboard' }: TopbarProps) {
  return (
    <header 
      className="bg-white flex items-center justify-between"
      style={{
        height: '64px',
        padding: '0 24px',
        borderBottom: '1px solid #E5E7EB'
      }}
    >
      {/* Page Title */}
      <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1C1E' }}>
        {pageTitle}
      </h1>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Bell Icon */}
        <button 
          className="relative transition-colors hover:bg-gray-100 rounded-full p-2"
          style={{ border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
        >
          <Bell size={20} style={{ color: '#6B7280' }} />
          {/* Notification Badge */}
          <span 
            className="absolute top-1 right-1 rounded-full"
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#DC2626'
            }}
          />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-3">
          <div 
            className="rounded-full flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#2563EB',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            A
          </div>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
            Admin
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 transition-colors hover:bg-gray-100 rounded-lg px-3 py-2"
          style={{ border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#6B7280' }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Logout</span>
        </button>
      </div>
    </header>
  );
}