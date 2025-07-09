import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp,
  Phone,
  Send,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface DashboardStats {
  user: {
    email: string;
    name: string;
    company: string;
    createdAt: string;
  };
  usage: {
    messagesSent: number;
    monthlyLimit: number;
    remainingMessages: number;
  };
  numbers: Array<{
    instanceId: string;
    instanceName: string;
    phoneNumber?: string;
    status: string;
    messagesSent: number;
    isActive: boolean;
  }>;
  totalNumbers: number;
  activeNumbers: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.getStats();
      setStats(response);
    } catch (error) {
      toast({
        title: 'Failed to load dashboard',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-whatsapp-gray">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
        <p className="text-whatsapp-gray">Failed to load dashboard data</p>
        <Button onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const usagePercentage = (stats.usage.messagesSent / stats.usage.monthlyLimit) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-success';
      case 'qr_ready':
      case 'initializing':
        return 'text-warning';
      case 'disconnected':
      case 'auth_failed':
        return 'text-error';
      default:
        return 'text-whatsapp-gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Connected';
      case 'qr_ready':
        return 'QR Ready';
      case 'initializing':
        return 'Initializing';
      case 'disconnected':
        return 'Disconnected';
      case 'auth_failed':
        return 'Auth Failed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-whatsapp-dark">Dashboard</h1>
        <p className="text-whatsapp-gray">
          Welcome back, {stats.user.name}! Here's your WhatsApp API overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
            <Phone className="h-4 w-4 text-whatsapp-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-whatsapp-dark">{stats.totalNumbers}</div>
            <p className="text-xs text-whatsapp-gray">
              {stats.activeNumbers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-whatsapp-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-whatsapp-dark">{stats.usage.messagesSent}</div>
            <p className="text-xs text-whatsapp-gray">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Activity className="h-4 w-4 text-whatsapp-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-whatsapp-dark">{stats.usage.remainingMessages}</div>
            <p className="text-xs text-whatsapp-gray">
              Messages left
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-whatsapp-gray" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-whatsapp-dark">{usagePercentage.toFixed(1)}%</div>
            <p className="text-xs text-whatsapp-gray">
              Of monthly limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            Your message usage for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.usage.messagesSent} sent</span>
              <span>{stats.usage.monthlyLimit} limit</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
            {usagePercentage > 80 && (
              <div className="flex items-center gap-2 text-warning text-sm mt-2">
                <AlertCircle className="h-4 w-4" />
                You're approaching your monthly limit
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Numbers Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>WhatsApp Numbers</CardTitle>
            <CardDescription>
              Manage your connected WhatsApp numbers
            </CardDescription>
          </div>
          <Button asChild className="bg-whatsapp-green hover:bg-whatsapp-green-hover">
            <Link to="/numbers">
              <Users className="h-4 w-4 mr-2" />
              Manage Numbers
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.numbers.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-whatsapp-gray mx-auto mb-4" />
              <p className="text-whatsapp-gray mb-4">No WhatsApp numbers added yet</p>
              <Button asChild className="bg-whatsapp-green hover:bg-whatsapp-green-hover">
                <Link to="/numbers">Add Your First Number</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.numbers.slice(0, 5).map((number) => (
                <div
                  key={number.instanceId}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-whatsapp-dark">
                        {number.instanceName}
                      </span>
                      {number.phoneNumber && (
                        <span className="text-sm text-whatsapp-gray">
                          +{number.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-whatsapp-dark">
                        {number.messagesSent} sent
                      </div>
                      <div className={`text-sm ${getStatusColor(number.status)}`}>
                        {getStatusText(number.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {stats.numbers.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/numbers">View All {stats.numbers.length} Numbers</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/numbers" className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Add WhatsApp Number</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/send" className="flex flex-col items-center gap-2">
                <Send className="h-6 w-6" />
                <span>Send Message</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link to="/settings" className="flex flex-col items-center gap-2">
                <Clock className="h-6 w-6" />
                <span>View Settings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};