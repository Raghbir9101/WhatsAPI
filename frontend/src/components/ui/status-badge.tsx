import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DeviceStatus = 'ready' | 'qr_ready' | 'auth_failed' | 'disconnected' | 'new' | 'initializing' | 'authenticated';

interface StatusBadgeProps {
  status: DeviceStatus;
  className?: string;
}

const statusConfig = {
  ready: {
    label: 'Ready',
    className: 'bg-success/10 text-success border-success/20',
  },
  qr_ready: {
    label: 'QR Ready',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  auth_failed: {
    label: 'Auth Failed',
    className: 'bg-error/10 text-error border-error/20',
  },
  disconnected: {
    label: 'Disconnected',
    className: 'bg-muted text-muted-foreground border-border',
  },
  new: {
    label: 'New',
    className: 'bg-info/10 text-info border-info/20',
  },
  initializing: {
    label: 'Initializing',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  authenticated: {
    label: 'Authenticated',
    className: 'bg-success/10 text-success border-success/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disconnected;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}