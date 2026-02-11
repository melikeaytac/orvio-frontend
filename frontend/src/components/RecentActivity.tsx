import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface RecentActivityProps {
  isLoading?: boolean;
  activities?: {
    time: string;
    fridge: string;
    action: 'Take' | 'Return';
    count: string;
  }[];
}

export default function RecentActivity({ isLoading = false, activities }: RecentActivityProps) {
  const fallbackActivities = [
    {
      time: '10:45 AM',
      fridge: 'Fridge A-12',
      action: 'Take',
      count: '3 items'
    },
    {
      time: '10:32 AM',
      fridge: 'Fridge B-08',
      action: 'Return',
      count: '2 items'
    },
    {
      time: '10:18 AM',
      fridge: 'Fridge C-05',
      action: 'Take',
      count: '5 items'
    },
    {
      time: '09:55 AM',
      fridge: 'Fridge A-03',
      action: 'Take',
      count: '1 item'
    },
    {
      time: '09:42 AM',
      fridge: 'Fridge D-11',
      action: 'Return',
      count: '4 items'
    },
    {
      time: '09:28 AM',
      fridge: 'Fridge B-08',
      action: 'Take',
      count: '2 items'
    }
  ];

  const resolvedActivities = activities ?? fallbackActivities;

  return (
    <div 
      className="bg-white"
      style={{
        height: '300px',
        borderRadius: '12px',
        boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1C1E', marginBottom: '16px' }}>
        Recent Activity
      </h2>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {activity.action === 'Take' ? (
                    <ArrowDownCircle size={20} style={{ color: '#2563EB' }} />
                  ) : (
                    <ArrowUpCircle size={20} style={{ color: '#059669' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1C1E' }}>
                      {activity.fridge}
                    </p>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {activity.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: activity.action === 'Take' ? '#2563EB' : '#059669'
                      }}
                    >
                      {activity.action}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>
                      {activity.count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}