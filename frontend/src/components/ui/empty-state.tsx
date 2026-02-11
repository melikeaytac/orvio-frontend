import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = "No data available", 
  description = "There is no data to display at this time.",
  icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-gray-300 mb-4">
        {icon || <Database size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
        {title}
      </h3>
      <p className="text-gray-500 text-center" style={{ fontSize: '14px', maxWidth: '400px' }}>
        {description}
      </p>
    </div>
  );
}
