import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Search, Plus } from 'lucide-react';
import FridgeListTable, { FridgeData } from './FridgeListTable';
import { ExportButton } from './ui/export-button';
import { TableSkeleton } from './ui/table-skeleton';
import { getAdminDevices } from '../api/client';
import { formatRelativeTime } from '../utils/time';
import { exportData } from '../utils/export';
import fridgeIllustration from '../assets/fridge-illustration.svg';

interface FridgeListProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onViewFridge: (fridgeId: string) => void;
}

export default function FridgeList({ onLogout, onNavigate, onViewFridge }: FridgeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fridges, setFridges] = useState<FridgeData[]>([]);

  const normalizeStatus = (status?: string | null): 'online' | 'offline' => {
    if (!status) return 'offline';
    const normalized = status.toLowerCase();
    return normalized.includes('online') || normalized.includes('active') ? 'online' : 'offline';
  };

  useEffect(() => {
    let isMounted = true;
    const loadFridges = async () => {
      setIsLoading(true);
      try {
        const response = await getAdminDevices({ limit: 100 });
        const devices = response.data;
        const mapped = devices.map((device) => ({
          id: device.device_id,
          name: device.name || 'Unnamed fridge',
          location: device.location_description || 'Unknown location',
          status: normalizeStatus(device.status),
          door: device.door_status ? 'open' : 'closed',
          lastActive: formatRelativeTime(device.last_checkin_time || null),
        }));
        if (isMounted) {
          setFridges(mapped);
        }
      } catch (error) {
        console.error('Failed to load devices', error);
        if (isMounted) setFridges([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFridges();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setLocationFilter('');
  };

  const handleExport = async (format: 'csv' | 'png' | 'pdf') => {
    const data = fridges.map(f => ({
      Name: f.name,
      Location: f.location,
      Status: f.status,
      Door: f.door,
      'Last Active': f.lastActive
    }));

    if (format === 'csv') {
      await exportData(format, data, { filename: 'fridge-list' });
    } else {
      await exportData(format, 'fridge-list-table', {
        filename: 'fridge-list',
        title: 'Fridge List'
      });
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Sidebar */}
      <Sidebar activePage="Fridges" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar onLogout={onLogout} pageTitle="Fridges" />

        {/* Content */}
        <main style={{ padding: '24px' }}>
          {/* Page Header - Filters + Actions */}
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            {/* Left Side: Filters */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search fridge by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    width: '300px',
                    height: '40px',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  width: '160px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  color: statusFilter ? '#1A1C1E' : '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <option value="">Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="has-alerts">Has Alerts</option>
              </select>

              {/* Location Dropdown */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  width: '200px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  color: locationFilter ? '#1A1C1E' : '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <option value="">Location</option>
                <option value="building-a">Building A</option>
                <option value="building-b">Building B</option>
                <option value="building-c">Building C</option>
                <option value="building-d">Building D</option>
              </select>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-4">
              <ExportButton onExport={handleExport} />
              <button
                className="flex items-center gap-2 transition-colors hover:bg-blue-700"
                style={{
                  height: '40px',
                  padding: '0 16px',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => alert('Add Fridge functionality')}
              >
                <Plus size={18} />
                Add Fridge
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            {/* Fridge List Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <div id="fridge-list-table">
                  <FridgeListTable 
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    locationFilter={locationFilter}
                    onClearFilters={handleClearFilters}
                    onViewFridge={onViewFridge}
                    fridges={fridges}
                  />
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className="hidden lg:flex pointer-events-none items-center justify-center"
              style={{
                width: '220px',
                minWidth: '220px',
                position: 'sticky',
                top: '180px',
                alignSelf: 'flex-start',
                marginTop: '8px',
              }}
            >
              <img
                src={fridgeIllustration}
                alt=""
                style={{ width: '220px', height: '293px', display: 'block' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center" style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
              © 2025 Smart Fridge System
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}