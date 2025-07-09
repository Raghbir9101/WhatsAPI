import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MessageSquare, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function AnalyticsCards() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.getStats(),
  });

  const cards = [
    {
      title: 'Messages Sent',
      value: stats?.usage.messagesSent || 0,
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
    },
    {
      title: 'Active Devices',
      value: stats?.activeNumbers || 0,
      change: '+2',
      trend: 'up',
      icon: CheckCircle,
    },
    {
      title: 'Total Devices',
      value: stats?.totalNumbers || 0,
      change: '0%',
      trend: 'neutral',
      icon: Users,
    },
    {
      title: 'Remaining Messages',
      value: stats?.usage.remainingMessages || 0,
      change: '-5%',
      trend: 'down',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {card.value.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {card.trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
              {card.trend === 'down' && <TrendingDown className="h-3 w-3 text-error" />}
              <span className={card.trend === 'up' ? 'text-success' : card.trend === 'down' ? 'text-error' : ''}>
                {card.change}
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}