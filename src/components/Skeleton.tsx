import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  style 
}) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius, 
        ...style 
      }} 
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card" style={{ cursor: 'default' }}>
      <Skeleton height="150px" borderRadius="8px" style={{ marginBottom: '12px' }} />
      <Skeleton height="20px" width="80%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="60%" />
    </div>
  );
};

export const HorizontalCardSkeleton: React.FC = () => {
  return (
    <div style={{ aspectRatio: '35 / 24', width: '85vw', maxWidth: '350px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <Skeleton height="100%" width="100%" borderRadius="8px" />
    </div>
  );
};
