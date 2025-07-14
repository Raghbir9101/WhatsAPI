import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/admin-api';
import { 
  Users, 
  UserCheck, 
  UserX, 
  MessageSquare, 
  CreditCard,
  TrendingUp,
  Calendar,
  Activity,
  Smartphone,
  Wifi
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getAdminStats,
  });

  const { data: clients } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: adminApi.getClients,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      description: 'All registered clients',
      trend: '+12% from last month'
    },
    {
      title: 'Active Clients',
      value: stats?.activeClients || 0,
      icon: UserCheck,
      description: 'Currently active subscriptions',
      trend: '+8% from last month'
    },
    {
      title: 'Expired Clients',
      value: stats?.expiredClients || 0,
      icon: UserX,
      description: 'Clients with expired plans',
      trend: '-5% from last month'
    },
    {
      title: 'Messages Sent',
      value: formatNumber(stats?.totalMessagesSent || 0),
      icon: MessageSquare,
      description: 'Total messages sent',
      trend: '+25% from last month'
    },
    {
      title: 'WhatsApp Instances',
      value: stats?.totalWhatsAppInstances || 0,
      icon: Smartphone,
      description: 'Total WhatsApp numbers',
      trend: `${stats?.connectedWhatsAppInstances || 0} connected`
    },
    {
      title: 'Connected Instances',
      value: stats?.connectedWhatsAppInstances || 0,
      icon: Wifi,
      description: 'Currently connected & active',
      trend: stats?.totalWhatsAppInstances ? 
        `${Math.round(((stats?.connectedWhatsAppInstances || 0) / stats.totalWhatsAppInstances) * 100)}% connection rate` : 
        '0% connection rate'
    },
    {
      title: 'Credits Issued',
      value: formatNumber(stats?.totalCreditsIssued || 0),
      icon: CreditCard,
      description: 'Total credits allocated',
      trend: '+18% from last month'
    },
    {
      title: 'Credits Used',
      value: formatNumber(stats?.totalCreditsUsed || 0),
      icon: Activity,
      description: 'Total credits consumed',
      trend: '+22% from last month'
    },
    {
      title: 'Monthly Revenue',
      value: `$${formatNumber(stats?.monthlyRevenue || 0)}`,
      icon: TrendingUp,
      description: 'Revenue this month',
      trend: '+15% from last month'
    },
    {
      title: 'New Clients',
      value: stats?.newClientsThisMonth || 0,
      icon: Calendar,
      description: 'New clients this month',
      trend: '+20% from last month'
    }
  ];

  // Get clients with expiring plans (within 7 days)
  const expiringClients = clients?.filter(client => {
    const expiryDate = new Date(client.validityDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }) || [];

  // Get clients with low credits (less than 10% remaining)
  const lowCreditClients = clients?.filter(client => {
    const creditUsagePercent = (client.creditsUsed / client.creditsTotal) * 100;
    return creditUsagePercent > 90 && client.creditsRemaining > 0;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ceo-black">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-ceo-green mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Expiring Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiring Soon</CardTitle>
            <CardDescription>
              Clients with plans expiring within 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiringClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringClients.slice(0, 5).map((client) => {
                  const daysLeft = Math.ceil(
                    (new Date(client.validityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={client.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.company}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-orange-600">
                          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.package}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Credit Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Credits</CardTitle>
            <CardDescription>
              Clients with less than 10% credits remaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowCreditClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients with low credits</p>
            ) : (
              <div className="space-y-3">
                {lowCreditClients.slice(0, 5).map((client) => {
                  const usagePercent = Math.round((client.creditsUsed / client.creditsTotal) * 100);
                  return (
                    <div key={client.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.company}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-600">
                          {usagePercent}% used
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(client.creditsRemaining)} left
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}