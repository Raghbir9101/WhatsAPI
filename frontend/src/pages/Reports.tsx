import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  RefreshCw, 
  Calendar,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface WhatsAppInstance {
  instanceId: string;
  instanceName: string;
  phoneNumber?: string;
  isActive: boolean;
  status: string;
}

interface AnalyticsData {
  summary: {
    totalMessages: number;
    messagesByDirection: Record<string, number>;
    messagesByType: Record<string, number>;
    messagesByStatus: Record<string, number>;
  };
  timeline: {
    period: string;
    total: number;
    incoming: number;
    outgoing: number;
  }[];
  topContacts: {
    phoneNumber: string;
    messageCount: number;
    lastMessage: string;
  }[];
  campaigns: {
    totalCampaigns: number;
    completedCampaigns: number;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
  };
}

interface DeliveryReport {
  summary: Record<string, number>;
  dailyReport: {
    date: string;
    total: number;
    breakdown: Record<string, number>;
  }[];
}

interface PerformanceMetrics {
  messageVolume: {
    _id: string;
    hourlyVolume: { hour: number; count: number }[];
    dailyTotal: number;
  }[];
  responseRate: {
    percentage: number;
    totalSent: number;
    totalResponded: number;
  };
  activeHours: {
    hour: number;
    messageCount: number;
  }[];
  instancePerformance: {
    instanceName: string;
    phoneNumber: string;
    messageCount: number;
    isActive: boolean;
    status: string;
  }[];
}

export function Reports() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    granularity: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });
  const [performanceDays, setPerformanceDays] = useState(30);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    if (instances.length > 0) {
      loadAllReports();
    }
  }, [selectedInstance, dateFilter, performanceDays]);

  const loadInstances = async () => {
    try {
      const response = await apiClient.getNumbers();
      const activeInstances = response.numbers.filter(
        (instance: WhatsAppInstance) => instance.isActive
      );
      setInstances(activeInstances);
      setLoading(false);
    } catch (err) {
      console.error('Error loading instances:', err);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load WhatsApp instances',
        variant: 'destructive'
      });
    }
  };

  const loadAllReports = async () => {
    if (loading) return;
    
    setRefreshing(true);
    try {
      const params = {
        instanceId: selectedInstance === 'all' ? undefined : selectedInstance,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
        granularity: dateFilter.granularity
      };

      const [analytics, delivery, performance] = await Promise.all([
        apiClient.getAnalytics(params),
        apiClient.getDeliveryReport(params),
        apiClient.getPerformanceMetrics({
          instanceId: selectedInstance === 'all' ? undefined : selectedInstance,
          days: performanceDays
        })
      ]);

      setAnalyticsData(analytics);
      setDeliveryReport(delivery);
      setPerformanceMetrics(performance);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      const errorMessage = err.message || 'Failed to load reports';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    await loadAllReports();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'delivered':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'read':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Read</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const calculateSuccessRate = () => {
    if (!analyticsData) return 0;
    const total = analyticsData.summary.totalMessages;
    const failed = analyticsData.summary.messagesByStatus.failed || 0;
    return total > 0 ? ((total - failed) / total) * 100 : 0;
  };

  const getMostActiveHour = () => {
    if (!performanceMetrics?.activeHours.length) return 'N/A';
    const mostActive = performanceMetrics.activeHours[0];
    return `${mostActive.hour}:00`;
  };

  const getTopPerformingInstance = () => {
    if (!performanceMetrics?.instancePerformance.length) return 'N/A';
    const top = performanceMetrics.instancePerformance[0];
    return top.instanceName;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">View detailed analytics and usage reports</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">View detailed analytics and usage reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="instance">Instance</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instances</SelectItem>
                  {instances.map((instance) => (
                    <SelectItem key={instance.instanceId} value={instance.instanceId}>
                      {instance.instanceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="granularity">Granularity</Label>
              <Select value={dateFilter.granularity} onValueChange={(value: any) => setDateFilter(prev => ({ ...prev, granularity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="days">Performance Days</Label>
              <Select value={performanceDays.toString()} onValueChange={(value) => setPerformanceDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(analyticsData?.summary.totalMessages || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(calculateSuccessRate())}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+0.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(performanceMetrics?.responseRate.percentage || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.responseRate.totalResponded || 0} of {performanceMetrics?.responseRate.totalSent || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Instances</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {instances.filter(i => i.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  out of {instances.length} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Message Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Message Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {analyticsData?.timeline.length ? (
                  <div className="w-full">
                    <div className="grid grid-cols-7 gap-2">
                      {analyticsData.timeline.slice(0, 7).map((item, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(item.period).toLocaleDateString()}
                          </div>
                          <div className="bg-primary h-16 rounded flex items-end justify-center relative">
                            <div className="absolute bottom-0 w-full">
                              <div 
                                className="bg-blue-500 rounded" 
                                style={{ height: `${(item.outgoing / Math.max(...analyticsData.timeline.map(t => t.total))) * 60}px` }}
                              />
                              <div 
                                className="bg-green-500 rounded" 
                                style={{ height: `${(item.incoming / Math.max(...analyticsData.timeline.map(t => t.total))) * 60}px` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs mt-1 font-medium">{item.total}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center mt-4 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-sm">Outgoing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-sm">Incoming</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No timeline data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Contacts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Last Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData?.topContacts.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{contact.phoneNumber}</TableCell>
                      <TableCell>{contact.messageCount}</TableCell>
                      <TableCell>{new Date(contact.lastMessage).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          {/* Delivery Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(deliveryReport?.summary || {}).map(([status, count]) => (
              <Card key={status}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
                  {getStatusBadge(status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(count)}</div>
                  <Progress 
                    value={(count / (analyticsData?.summary.totalMessages || 1)) * 100} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Delivery Report */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Delivery Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryReport?.dailyReport.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.total}</TableCell>
                      <TableCell>{day.breakdown.sent || 0}</TableCell>
                      <TableCell>{day.breakdown.delivered || 0}</TableCell>
                      <TableCell>{day.breakdown.failed || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Most Active Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {getMostActiveHour()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Instance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  {getTopPerformingInstance()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(performanceMetrics?.responseRate.percentage || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {performanceMetrics?.responseRate.totalResponded} responses to {performanceMetrics?.responseRate.totalSent} messages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Instance Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Instance Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceMetrics?.instancePerformance.map((instance, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{instance.instanceName}</TableCell>
                      <TableCell>{instance.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>{formatNumber(instance.messageCount)}</TableCell>
                      <TableCell>
                        <Badge variant={instance.isActive ? 'default' : 'secondary'}>
                          {instance.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Active Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <div className="grid grid-cols-12 gap-1 h-full">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const activity = performanceMetrics?.activeHours.find(h => h.hour === hour);
                    const count = activity?.messageCount || 0;
                    const maxCount = Math.max(...(performanceMetrics?.activeHours.map(h => h.messageCount) || [1]));
                    const height = (count / maxCount) * 100;
                    
                    return (
                      <div key={hour} className="flex flex-col items-center">
                        <div className="flex-1 flex items-end w-full">
                          <div 
                            className="w-full bg-primary rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-xs mt-1">{hour}h</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaign Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.campaigns.totalCampaigns || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.campaigns.completedCampaigns || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(analyticsData?.campaigns.totalRecipients || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(
                    analyticsData?.campaigns.totalSent 
                      ? ((analyticsData.campaigns.totalSent - analyticsData.campaigns.totalFailed) / analyticsData.campaigns.totalSent) * 100
                      : 0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Messages Sent</span>
                  <span className="text-sm">{formatNumber(analyticsData?.campaigns.totalSent || 0)}</span>
                </div>
                <Progress 
                  value={analyticsData?.campaigns.totalSent ? (analyticsData.campaigns.totalSent / analyticsData.campaigns.totalRecipients) * 100 : 0} 
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Messages Failed</span>
                  <span className="text-sm">{formatNumber(analyticsData?.campaigns.totalFailed || 0)}</span>
                </div>
                <Progress 
                  value={analyticsData?.campaigns.totalSent ? (analyticsData.campaigns.totalFailed / analyticsData.campaigns.totalSent) * 100 : 0} 
                  className="bg-red-100"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}