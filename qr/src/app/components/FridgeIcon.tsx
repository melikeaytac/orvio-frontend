interface FridgeIconProps {
  className?: string;
}

export function FridgeIcon({ className = "w-full h-64" }: FridgeIconProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Beverage cooler outer frame */}
        <rect
          x="35"
          y="15"
          width="130"
          height="270"
          rx="6"
          fill="#9CA3AF"
          stroke="#6B7280"
          strokeWidth="2"
        />
        
        {/* Glass door - lighter grey to indicate transparency */}
        <rect
          x="45"
          y="30"
          width="110"
          height="240"
          rx="4"
          fill="#D1D5DB"
          stroke="#9CA3AF"
          strokeWidth="2"
          opacity="0.7"
        />
        
        {/* Door handle */}
        <rect
          x="140"
          y="140"
          width="6"
          height="40"
          rx="3"
          fill="#4B5563"
        />
        
        {/* Shelf 1 */}
        <line
          x1="50"
          y1="100"
          x2="150"
          y2="100"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        
        {/* Shelf 2 */}
        <line
          x1="50"
          y1="165"
          x2="150"
          y2="165"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        
        {/* Shelf 3 */}
        <line
          x1="50"
          y1="230"
          x2="150"
          y2="230"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
        
        {/* Abstract bottles/cans on top shelf */}
        <rect x="60" y="75" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="78" y="75" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="96" y="75" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="114" y="75" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        
        {/* Abstract bottles/cans on middle shelf */}
        <rect x="60" y="140" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="78" y="140" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="96" y="140" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="114" y="140" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        
        {/* Abstract bottles/cans on bottom shelf */}
        <rect x="60" y="205" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="78" y="205" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="96" y="205" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        <rect x="114" y="205" width="12" height="20" rx="2" fill="#6B7280" opacity="0.6" />
        
        {/* Top branding area - simple rectangle to suggest header */}
        <rect
          x="45"
          y="30"
          width="110"
          height="25"
          rx="4"
          fill="#9CA3AF"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}