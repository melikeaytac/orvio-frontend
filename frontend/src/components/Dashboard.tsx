import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SummaryCards from './SummaryCards';
import RecentAlerts from './RecentAlerts';
import RecentActivity from './RecentActivity';
import ConsumptionChart from './ConsumptionChart';
import { useState, useEffect } from 'react';
import {
  getAdminDevices,
  getDeviceAlerts,
  getDeviceTransactions,
  AdminDevice,
  DeviceAlert,
  DeviceTransaction,
} from '../api/client';
import { formatRelativeTime, formatTime } from '../utils/time';

type DashboardAlert = {
  type: string;
  fridge: string;
  severity: 'High' | 'Medium' | 'Low';
  time: string;
};

type DashboardActivity = {
  time: string;
  fridge: string;
  action: 'Take' | 'Return';
  count: string;
};

type WeeklyActivity = { day: string; sessions: number };

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onLogout, onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{ totalFridges: number; onlineFridges: number; activeSessions: number; totalAlerts: number } | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<DashboardAlert[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[] | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyActivity[] | null>(null);

  const getDeviceLabel = (device: AdminDevice) => device.name || device.device_id;

  const isOnlineStatus = (status?: string | null) => {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return normalized.includes('online') || normalized.includes('active');
  };

  const getSeverity = (alertType?: string | null): 'High' | 'Medium' | 'Low' => {
    const normalized = (alertType || '').toLowerCase();
    if (normalized.includes('temperature') || normalized.includes('door')) return 'High';
    if (normalized.includes('connection') || normalized.includes('power')) return 'Medium';
    return 'Low';
  };

  const getActionLabel = (transaction: DeviceTransaction): 'Take' | 'Return' => {
    const actionType = transaction.items?.[0]?.action_type || transaction.transaction_type;
    if (actionType && actionType.toLowerCase().includes('return')) return 'Return';
    return 'Take';
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const devicesResponse = await getAdminDevices({ limit: 100 });
        const devices = devicesResponse.data;
        const deviceNameMap = new Map(devices.map((device) => [device.device_id, getDeviceLabel(device)]));

        const alertsResults = await Promise.all(
          devices.map((device) => getDeviceAlerts(device.device_id, undefined, { limit: 100 }).then(r => r.data).catch(() => [] as DeviceAlert[]))
        );
        const allAlerts = alertsResults.flat();

        const transactionsResults = await Promise.all(
          devices.map((device) => getDeviceTransactions(device.device_id, { limit: 50 }).then(r => r.data).catch(() => [] as DeviceTransaction[]))
        );
        const allTransactions = transactionsResults.flat();

        const today = new Date();
        const todayKey = today.toDateString();
        const activeSessions = allTransactions.filter((txn) => {
          const txnDate = new Date(txn.start_time);
          return !Number.isNaN(txnDate.getTime()) && txnDate.toDateString() === todayKey;
        }).length;

        const nextStats = {
          totalFridges: devices.length,
          onlineFridges: devices.filter((device) => isOnlineStatus(device.status)).length,
          activeSessions,
          totalAlerts: allAlerts.length,
        };

        const nextRecentAlerts = allAlerts
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
          .map((alert) => ({
            type: alert.alert_type,
            fridge: deviceNameMap.get(alert.device_id) || alert.device_id,
            severity: getSeverity(alert.alert_type),
            time: formatRelativeTime(alert.timestamp),
          }));

        const nextRecentActivity = allTransactions
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          .slice(0, 6)
          .map((txn) => {
            const items = txn.items || [];
            const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            return {
              time: formatTime(txn.start_time),
              fridge: deviceNameMap.get(txn.device_id) || txn.device_id,
              action: getActionLabel(txn),
              count: `${totalItems || items.length || 1} items`,
            };
          });

        const days = Array.from({ length: 7 }, (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          return date;
        });

        const nextWeeklyData = days.map((date) => {
          const dayKey = date.toDateString();
          const sessions = allTransactions.filter((txn) => {
            const txnDate = new Date(txn.start_time);
            return !Number.isNaN(txnDate.getTime()) && txnDate.toDateString() === dayKey;
          }).length;
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sessions,
          };
        });

        if (!isMounted) return;
        setStats(nextStats);
        setRecentAlerts(nextRecentAlerts);
        setRecentActivity(nextRecentActivity);
        setWeeklyData(nextWeeklyData);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Sidebar */}
      <Sidebar activePage="Dashboard" onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar onLogout={onLogout} pageTitle="Dashboard" />

        {/* Content */}
        <main style={{ padding: '24px' }}>
          {/* Summary Cards */}
          <SummaryCards isLoading={isLoading} stats={stats || undefined} />

          {/* Widgets Grid */}
          <div className="grid grid-cols-3 gap-6" style={{ marginTop: '24px' }}>
            {/* Recent Alerts - 2 columns */}
            <div className="col-span-2">
              <RecentAlerts isLoading={isLoading} alerts={recentAlerts || undefined} />
            </div>

            {/* Recent Activity - 1 column */}
            <div className="col-span-1">
              <RecentActivity isLoading={isLoading} activities={recentActivity || undefined} />
            </div>
          </div>

          {/* Consumption Chart - Full Width */}
          <div style={{ marginTop: '24px' }}>
            <ConsumptionChart isLoading={isLoading} data={weeklyData || undefined} />
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