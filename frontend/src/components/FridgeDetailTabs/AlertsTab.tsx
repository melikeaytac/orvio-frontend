import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { TableSkeleton } from '../ui/table-skeleton';
import { getDeviceAlerts, updateAlert } from '../../api/client';
import { formatRelativeTime } from '../../utils/time';

interface AlertsTabProps {
  fridgeId: string;
  isLoading?: boolean;
}

interface Alert {
  id: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  message: string;
  status: 'Active' | 'Resolved' | 'Acknowledged';
}

export default function AlertsTab({ fridgeId, isLoading = false }: AlertsTabProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fallbackAlerts: Alert[] = [
    { id: 'ALT-001', type: 'Door Open', severity: 'High', timestamp: '2 mins ago', message: 'Door has been open for more than 5 minutes', status: 'Active' },
    { id: 'ALT-002', type: 'Temperature Warning', severity: 'Medium', timestamp: '1 hour ago', message: 'Temperature exceeded 6°C', status: 'Acknowledged' }
  ];

  const getSeverity = (alertType?: string | null): 'High' | 'Medium' | 'Low' => {
    const normalized = (alertType || '').toLowerCase();
    if (normalized.includes('temperature') || normalized.includes('door')) return 'High';
    if (normalized.includes('connection') || normalized.includes('power')) return 'Medium';
    return 'Low';
  };

  const formatStatus = (status?: string | null): 'Active' | 'Resolved' | 'Acknowledged' => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('resolved')) return 'Resolved';
    if (normalized.includes('ack')) return 'Acknowledged';
    return 'Active';
  };

  const resolveAlert = async (alertId: string, nextStatus: 'Acknowledged' | 'Resolved') => {
    try {
      await updateAlert(alertId, nextStatus.toUpperCase());
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === alertId ? { ...alert, status: nextStatus } : alert))
      );
    } catch (error) {
      console.error('Failed to update alert', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadAlerts = async () => {
      setIsFetching(true);
      try {
        const result = await getDeviceAlerts(fridgeId);
        const mapped = result.map((alert) => ({
          id: alert.alert_id,
          type: alert.alert_type,
          severity: getSeverity(alert.alert_type),
          timestamp: formatRelativeTime(alert.timestamp),
          message: alert.message,
          status: formatStatus(alert.status),
        }));
        if (isMounted) {
          setAlerts(mapped.length > 0 ? mapped : []);
        }
      } catch (error) {
        console.error('Failed to load alerts', error);
        if (isMounted) setAlerts(fallbackAlerts);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, [fridgeId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return '#DC2626';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#DC2626';
      case 'Acknowledged':
        return '#F59E0B';
      case 'Resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  // Empty state
  if (alerts.length === 0 && !isLoading && !isFetching) {
    return (
      <div
        className="bg-white flex flex-col items-center justify-center"
        style={{
          minHeight: '400px',
          borderRadius: '12px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
          padding: '40px'
        }}
      >
        <EmptyState 
          title="No alerts for this fridge"
          description="This fridge is operating normally."
          icon={<AlertTriangle size={48} strokeWidth={1.5} />}
        />
      </div>
    );
  }

  // Alerts table (shown when there are alerts)
  return (
    <div
      className="bg-white"
      style={{
        width: '100%',
        minHeight: '400px',
        borderRadius: '12px',
        boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
        padding: '24px'
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E', marginBottom: '20px' }}>
        Alerts
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Alert Type
            </th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Severity
            </th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Timestamp
            </th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Message
            </th>
            <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Status
            </th>
            <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading || isFetching ? (
            <TableSkeleton rows={5} columns={6} />
          ) : (
            alerts.map((alert, index) => (
              <tr
                key={alert.id}
                className="transition-colors"
                style={{
                  borderBottom: index < alerts.length - 1 ? '1px solid #F3F4F6' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                  {alert.type}
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getSeverityColor(alert.severity),
                      backgroundColor: `${getSeverityColor(alert.severity)}15`
                    }}
                  >
                    {alert.severity}
                  </span>
                </td>
                <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>
                  {alert.timestamp}
                </td>
                <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>
                  {alert.message}
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getStatusColor(alert.status),
                      backgroundColor: `${getStatusColor(alert.status)}15`
                    }}
                  >
                    {alert.status}
                  </span>
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    {alert.status === 'Active' && (
                      <>
                        <button
                          className="transition-colors hover:underline"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                          onClick={() => resolveAlert(alert.id, 'Acknowledged')}
                        >
                          Acknowledge
                        </button>
                        <span style={{ color: '#D1D5DB' }}>|</span>
                        <button
                          className="transition-colors hover:underline"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10B981',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                          onClick={() => resolveAlert(alert.id, 'Resolved')}
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    {alert.status === 'Acknowledged' && (
                      <button
                        className="transition-colors hover:underline"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#10B981',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                        onClick={() => resolveAlert(alert.id, 'Resolved')}
                      >
                        Resolve
                      </button>
                    )}
                    {alert.status === 'Resolved' && (
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}