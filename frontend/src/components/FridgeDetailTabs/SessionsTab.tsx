import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { TableSkeleton } from '../ui/table-skeleton';
import { getDeviceTransactions } from '../../api/client';
import { formatDuration, formatTime } from '../../utils/time';

interface SessionsTabProps {
  fridgeId: string;
  isLoading?: boolean;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  duration: string;
  actions: { type: 'take' | 'return'; product: string; quantity: number }[];
}

export default function SessionsTab({ fridgeId, isLoading = false }: SessionsTabProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      setIsFetching(true);
      try {
        const response = await getDeviceTransactions(fridgeId, { limit: 50 });
        const transactions = response.data;
        const mapped = transactions.map((txn) => {
          const items = txn.items || [];
          const actions = items.map((item) => ({
            type: item.action_type && item.action_type.toLowerCase().includes('return') ? 'return' : 'take',
            product: item.product?.name || 'Unknown product',
            quantity: item.quantity,
          }));
          return {
            id: txn.transaction_id,
            startTime: formatTime(txn.start_time),
            endTime: formatTime(txn.end_time || txn.start_time),
            duration: formatDuration(txn.start_time, txn.end_time || undefined),
            actions,
          };
        });
        if (isMounted) {
          setSessions(mapped);
        }
      } catch (error) {
        console.error('Failed to load sessions', error);
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [fridgeId]);

  return (
    <div className="relative">
      {/* Sessions Table */}
      <div
        className="bg-white"
        style={{
          width: '100%',
          minHeight: '360px',
          borderRadius: '12px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
          padding: '24px'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E', marginBottom: '20px' }}>
          Recent Sessions
        </h2>

        <div style={{ overflowX: 'auto' }}>
          {isLoading || isFetching ? (
            <TableSkeleton columns={5} rows={5} />
          ) : sessions.length === 0 ? (
            <EmptyState 
              title="No sessions found"
              description="There are no recent sessions for this fridge."
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                    Session ID
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                    Start Time
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                    End Time
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                    Duration
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr
                    key={session.id}
                    className="transition-colors"
                    style={{
                      borderBottom: index < sessions.length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px 8px' }}>
                      <code 
                        className="hover:underline cursor-pointer"
                        style={{ 
                          fontSize: '13px', 
                          fontWeight: 500, 
                          color: '#2563EB',
                          fontFamily: 'monospace'
                        }}
                        title={session.id}
                        onClick={() => setSelectedSession(session)}
                      >
                        {session.id}
                      </code>
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1A1C1E' }}>
                      {session.startTime}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1A1C1E' }}>
                      {session.endTime}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#6B7280' }}>
                      {session.duration}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="transition-colors hover:underline"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Session Detail Drawer */}
      {selectedSession && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedSession(null)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', top: 0, left: 0 }}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 h-full bg-white shadow-xl z-50"
            style={{
              width: '380px',
              padding: '24px',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E' }}>
                Session Details
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="transition-colors hover:bg-gray-100 rounded p-1"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Session Info */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Session ID</p>
                <code style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', fontFamily: 'monospace' }}>
                  {selectedSession.id}
                </code>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Time Range</p>
                <p style={{ fontSize: '14px', color: '#1A1C1E' }}>
                  {selectedSession.startTime} - {selectedSession.endTime}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Duration</p>
                <p style={{ fontSize: '14px', color: '#1A1C1E' }}>{selectedSession.duration}</p>
              </div>
            </div>

            {/* Actions List */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1C1E', marginBottom: '16px' }}>
                Product Actions
              </h4>
              <div className="space-y-3">
                {selectedSession.actions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <div className="flex-shrink-0">
                      {action.type === 'take' ? (
                        <Clock size={20} style={{ color: '#2563EB' }} />
                      ) : (
                        <Clock size={20} style={{ color: '#059669' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                        {action.product}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: action.type === 'take' ? '#2563EB' : '#059669',
                            textTransform: 'capitalize'
                          }}
                        >
                          {action.type}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          × {action.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div
                className="mt-4 p-3 rounded-lg"
                style={{ backgroundColor: '#F0F9FF', borderLeft: '3px solid #2563EB' }}
              >
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Summary</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                  {selectedSession.actions.filter(a => a.type === 'take').length} items taken, {' '}
                  {selectedSession.actions.filter(a => a.type === 'return').length} items returned
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}