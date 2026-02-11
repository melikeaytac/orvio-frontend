import { Download } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface ExportButtonProps {
  onExport?: (format: 'csv' | 'png' | 'pdf') => void;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const handleExport = (format: 'csv' | 'png' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default mock export behavior
      alert(`Exporting as ${format.toUpperCase()}...`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="gap-2"
        >
          <Download size={16} />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
