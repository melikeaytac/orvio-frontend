import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Search, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { EmptyState } from './ui/empty-state';
import { ExportButton } from './ui/export-button';
import { TableSkeleton, ChartSkeleton } from './ui/table-skeleton';
import { getAdminDevices, getDeviceTransactions } from '../api/client';
import { formatTime } from '../utils/time';

interface TransactionsScreenProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface Transaction {
  id: string;
  timestamp: string;
  createdAt: string;
  fridge: string;
  fridgeId: string;
  product: string;
  action: 'Take' | 'Return';
  quantity: number;
  sessionId: string;
}

export default function TransactionsScreen({ onLogout, onNavigate }: TransactionsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fridgeFilter, setFridgeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fridges, setFridges] = useState<{ id: string; name: string }[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fallbackTransactions: Transaction[] = [
    { id: 'TXN-001', timestamp: '10:45 AM', createdAt: new Date().toISOString(), fridge: 'Main Entrance Fridge', fridgeId: 'FR-00123', product: 'Coca Cola 330ml', action: 'Take', quantity: 2, sessionId: 'S-001' },
    { id: 'TXN-002', timestamp: '10:44 AM', createdAt: new Date().toISOString(), fridge: 'Main Entrance Fridge', fridgeId: 'FR-00123', product: 'Chicken Sandwich', action: 'Take', quantity: 1, sessionId: 'S-002' },
    { id: 'TXN-003', timestamp: '10:32 AM', createdAt: new Date().toISOString(), fridge: 'Cafeteria Fridge A', fridgeId: 'FR-00124', product: 'Orange Juice 500ml', action: 'Return', quantity: 2, sessionId: 'S-003' },
    { id: 'TXN-004', timestamp: '10:18 AM', createdAt: new Date().toISOString(), fridge: 'Office Kitchen Fridge', fridgeId: 'FR-00125', product: 'Mineral Water 500ml', action: 'Take', quantity: 3, sessionId: 'S-004' },
    { id: 'TXN-005', timestamp: '10:17 AM', createdAt: new Date().toISOString(), fridge: 'Office Kitchen Fridge', fridgeId: 'FR-00125', product: 'Greek Yogurt', action: 'Take', quantity: 2, sessionId: 'S-005' },
    { id: 'TXN-006', timestamp: '09:55 AM', createdAt: new Date().toISOString(), fridge: 'Lobby Fridge', fridgeId: 'FR-00126', product: 'Energy Drink', action: 'Take', quantity: 1, sessionId: 'S-006' },
    { id: 'TXN-007', timestamp: '09:42 AM', createdAt: new Date().toISOString(), fridge: 'Break Room Fridge', fridgeId: 'FR-00127', product: 'Caesar Salad', action: 'Return', quantity: 1, sessionId: 'S-007' },
    { id: 'TXN-008', timestamp: '09:41 AM', createdAt: new Date().toISOString(), fridge: 'Break Room Fridge', fridgeId: 'FR-00127', product: 'Cheese Sticks', action: 'Return', quantity: 3, sessionId: 'S-008' }
  ];

  const fallbackTopProducts = [
    { name: 'Coca Cola', count: 45 },
    { name: 'Water', count: 38 },
    { name: 'Sandwich', count: 28 },
    { name: 'Juice', count: 22 },
    { name: 'Yogurt', count: 18 }
  ];

  const fallbackHourlyActivity = [
    { hour: '6AM', count: 5 },
    { hour: '7AM', count: 12 },
    { hour: '8AM', count: 25 },
    { hour: '9AM', count: 38 },
    { hour: '10AM', count: 45 },
    { hour: '11AM', count: 52 },
    { hour: '12PM', count: 48 },
    { hour: '1PM', count: 35 },
    { hour: '2PM', count: 28 }
  ];

  const getActionLabel = (actionType?: string | null): 'Take' | 'Return' => {
    if (actionType && actionType.toLowerCase().includes('return')) return 'Return';
    return 'Take';
  };

  useEffect(() => {
    let isMounted = true;
    const loadTransactions = async () => {
      setIsFetching(true);
      setIsLoading(true);
      try {
        const devices = await getAdminDevices();
        const deviceNameMap = new Map(devices.map((device) => [device.device_id, device.name || device.device_id]));
        const deviceOptions = devices.map((device) => ({ id: device.device_id, name: device.name || device.device_id }));
        const results = await Promise.all(
          devices.map((device) => getDeviceTransactions(device.device_id, 100).catch(() => []))
        );
        const flattened = results.flat();

        const mapped = flattened.flatMap((txn) => {
          const items = txn.items || [];
          if (items.length === 0) {
            return [{
              id: txn.transaction_id,
              timestamp: formatTime(txn.start_time),
              createdAt: txn.start_time,
              fridge: deviceNameMap.get(txn.device_id) || txn.device_id,
              fridgeId: txn.device_id,
              product: 'Unknown product',
              action: getActionLabel(txn.transaction_type),
              quantity: 1,
              sessionId: txn.transaction_id,
            }];
          }
          return items.map((item) => ({
            id: `${txn.transaction_id}-${item.transaction_item_id}`,
            timestamp: formatTime(txn.start_time),
            createdAt: txn.start_time,
            fridge: deviceNameMap.get(txn.device_id) || txn.device_id,
            fridgeId: txn.device_id,
            product: item.product?.name || 'Unknown product',
            action: getActionLabel(item.action_type || txn.transaction_type),
            quantity: item.quantity,
            sessionId: txn.transaction_id,
          }));
        });

        if (isMounted) {
          setFridges(deviceOptions);
          setTransactions(mapped.length > 0 ? mapped : fallbackTransactions);
        }
      } catch (error) {
        console.error('Failed to load transactions', error);
        if (isMounted) {
          setFridges([
            { id: 'FR-00123', name: 'Main Entrance Fridge' },
            { id: 'FR-00124', name: 'Cafeteria Fridge A' },
            { id: 'FR-00125', name: 'Office Kitchen Fridge' },
          ]);
          setTransactions(fallbackTransactions);
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
          setIsLoading(false);
        }
      }
    };

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  const dateRangeStart = useMemo(() => {
    const now = new Date();
    if (dateRange === '7days') {
      now.setDate(now.getDate() - 7);
      return now;
    }
    if (dateRange === '30days') {
      now.setDate(now.getDate() - 30);
      return now;
    }
    return new Date(now.toDateString());
  }, [dateRange]);

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.fridge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.sessionId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFridge = !fridgeFilter || txn.fridgeId === fridgeFilter;
    const matchesProduct = !productFilter || txn.product === productFilter;

    const matchesDate = dateRangeStart ? new Date(txn.createdAt) >= dateRangeStart : true;

    return matchesSearch && matchesFridge && matchesProduct && matchesDate;
  });

  const getActionColor = (action: string) => {
    return action === 'Take' ? '#2563EB' : '#059669';
  };

  const analyticsSource = filteredTransactions.length > 0 ? filteredTransactions : transactions;
  const topProductsData = useMemo(() => {
    if (analyticsSource.length === 0) return fallbackTopProducts;
    const counts = new Map<string, number>();
    analyticsSource.forEach((txn) => {
      counts.set(txn.product, (counts.get(txn.product) || 0) + txn.quantity);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analyticsSource]);

  const hourlyActivityData = useMemo(() => {
    if (analyticsSource.length === 0) return fallbackHourlyActivity;
    const hours = new Map<string, number>();
    analyticsSource.forEach((txn) => {
      const date = new Date(txn.createdAt);
      const hour = date.toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', '');
      hours.set(hour, (hours.get(hour) || 0) + txn.quantity);
    });
    return Array.from(hours.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .slice(0, 9);
  }, [analyticsSource]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <Sidebar activePage="Transactions" onNavigate={onNavigate} />

      <div className="flex-1 flex flex-col">
        <Topbar onLogout={onLogout} pageTitle="Transactions" />

        <main style={{ padding: '24px' }}>
          {/* Filters */}
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            {/* Left Section */}
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
                  placeholder="Search transactions..."
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

              {/* Fridge Dropdown */}
              <select
                value={fridgeFilter}
                onChange={(e) => setFridgeFilter(e.target.value)}
                className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  width: '200px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  color: fridgeFilter ? '#1A1C1E' : '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Fridges</option>
                {fridges.map((fridge) => (
                  <option key={fridge.id} value={fridge.id}>
                    {fridge.id} - {fridge.name}
                  </option>
                ))}
              </select>

              {/* Product Dropdown */}
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  width: '200px',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  color: productFilter ? '#1A1C1E' : '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Products</option>
                {Array.from(new Set(transactions.map((txn) => txn.product))).map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </div>

            {/* Right Section - Date Range */}
            <div className="flex items-center gap-2">
              <Calendar size={18} style={{ color: '#6B7280' }} />
              <button
                onClick={() => setDateRange('today')}
                className="transition-colors"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: dateRange === 'today' ? '#EFF6FF' : 'transparent',
                  color: dateRange === 'today' ? '#2563EB' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className="transition-colors"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: dateRange === '7days' ? '#EFF6FF' : 'transparent',
                  color: dateRange === '7days' ? '#2563EB' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className="transition-colors"
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: dateRange === '30days' ? '#EFF6FF' : 'transparent',
                  color: dateRange === '30days' ? '#2563EB' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div
            className="bg-white"
            style={{
              borderRadius: '12px',
              boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
              padding: '24px',
              marginBottom: '24px',
              overflow: 'auto'
            }}
          >
            {isLoading || isFetching ? (
              <TableSkeleton />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Timestamp
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Fridge
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Product
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Action
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Quantity
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Session ID
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn, index) => (
                    <tr
                      key={txn.id}
                      className="transition-colors"
                      style={{
                        borderBottom: index < filteredTransactions.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '18px 8px', fontSize: '14px', color: '#1A1C1E' }}>
                        {txn.timestamp}
                      </td>
                      <td style={{ padding: '18px 8px', fontSize: '14px', color: '#6B7280' }}>
                        {txn.fridge}
                      </td>
                      <td style={{ padding: '18px 8px', fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                        {txn.product}
                      </td>
                      <td style={{ padding: '18px 8px' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: getActionColor(txn.action)
                          }}
                        >
                          {txn.action}
                        </span>
                      </td>
                      <td style={{ padding: '18px 8px', fontSize: '14px', fontWeight: 600, color: '#1A1C1E', textAlign: 'center' }}>
                        {txn.action === 'Take' ? '-' : '+'}{txn.quantity}
                      </td>
                      <td style={{ padding: '18px 8px' }}>
                        <code 
                          className="hover:underline cursor-pointer"
                          style={{ 
                            fontSize: '13px', 
                            color: '#2563EB', 
                            fontFamily: 'monospace',
                            fontWeight: 500
                          }}
                          title={txn.sessionId}
                        >
                          {txn.sessionId}
                        </code>
                      </td>
                      <td style={{ padding: '18px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => alert(`View session ${txn.sessionId}`)}
                          className="transition-colors hover:underline"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          View Session
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {filteredTransactions.length === 0 && !isLoading && !isFetching && (
              <EmptyState 
                title="No transactions found"
                description="Try adjusting your search filters to find transactions."
              />
            )}
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '24px' }}>
            {/* Top Products Chart */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <div
                className="bg-white"
                style={{
                  height: '260px',
                  borderRadius: '12px',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
                  padding: '20px'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1C1E' }}>
                    Top Products
                  </h3>
                  <ExportButton />
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Hourly Activity Chart */}
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <div
                className="bg-white"
                style={{
                  height: '260px',
                  borderRadius: '12px',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
                  padding: '20px'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1C1E' }}>
                    Hourly Activity
                  </h3>
                  <ExportButton />
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={hourlyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
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