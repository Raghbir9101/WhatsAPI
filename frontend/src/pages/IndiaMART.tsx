import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  Eye,
  Edit,
  Search,
  Filter,
  Plus,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

// Types
interface IndiaMartLead {
  _id: string;
  uniqueQueryId: string;
  queryTime: string;
  queryType: string;
  queryMessage: string;
  senderName: string;
  senderMobile: string;
  senderEmail: string;
  senderCompany: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPincode: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  notes: string;
  followUpDate: string;
  productName: string;
  createdAt: string;
}

interface IndiaMartConfig {
  _id: string;
  name?: string;
  displayName?: string;
  apiKey?: string;
  crmKey?: string;
  isActive: boolean;
  fetchInterval?: number;
  overlapDuration?: number;
  settings: {
    fetchInterval?: number;
    overlapDuration?: number;
    autoFetch: boolean;
    retryFailedCalls: boolean;
    maxRetries: number;
    notifications: boolean;
  };
  metadata?: {
    lastFetchTime: string;
    nextFetchTime: string;
    totalLeadsFetched: number;
    totalApiCalls: number;
    lastApiCallStatus: string;
    lastApiCallError: string;
  };
  // Legacy fields for backward compatibility
  lastFetchTime?: string;
  nextFetchTime?: string;
  totalLeadsFetched?: number;
  totalApiCalls?: number;
  lastApiCallStatus?: string;
  lastApiCallError?: string;
}

interface DashboardData {
  configured: boolean;
  config?: IndiaMartConfig;
  statistics: {
    totalLeads: number;
    todayLeads: number;
    weekLeads: number;
    monthLeads: number;
    statusCounts: Record<string, number>;
  };
  fetchInfo: {
    lastFetch: string | null;
    nextFetch: string | null;
    timeUntilNextFetch: number;
    totalApiCalls: number;
    lastApiCallStatus: string;
    lastApiCallError: string | null;
  };
  recentActivity: any[];
}

const IndiaMART = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<IndiaMartLead | null>(null);
  const [configForm, setConfigForm] = useState({
    crmKey: '',
    fetchInterval: 15,
    overlapDuration: 5,
    autoFetch: true,
    retryFailedCalls: true,
    maxRetries: 3,
    notifications: true
  });
  const [leadFilters, setLeadFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    senderName: '',
    senderMobile: '',
    queryType: '',
    page: 1,
    limit: 20
  });

  const queryClient = useQueryClient();

  // Test API connection
  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      // Use the health endpoint instead
      const response = await fetch('/api/health');
      const data = await response.json();
      console.log('API test response:', data);
      toast.success('API connection successful!');
    } catch (error) {
      console.error('API test failed:', error);
      toast.error('API connection failed: ' + error.message);
    }
  };

  // Test with API client
  const testApiClient = async () => {
    try {
      console.log('Testing API client...');
      const data = await apiClient.getIndiaMartConfig();
      console.log('API client response:', data);
      toast.success('API client connection successful!');
    } catch (error) {
      console.error('API client test failed:', error);
      toast.error('API client failed: ' + error.message);
    }
  };

  // Test CRM connection
  const testCrmConnection = async () => {
    try {
      console.log('🔍 [FRONTEND] Testing CRM connection...');
      console.log('🔍 [FRONTEND] Calling apiClient.fetchIndiaMartLeads()');
      
      const response = await apiClient.fetchIndiaMartLeads();
      
      console.log('✅ [FRONTEND] CRM test response received:', response);
      console.log('✅ [FRONTEND] Response type:', typeof response);
      console.log('✅ [FRONTEND] Response keys:', Object.keys(response || {}));
      
      toast.success('CRM connection successful! Test fetch completed.');
    } catch (error) {
      console.error('❌ [FRONTEND] CRM test failed:', error);
      console.error('❌ [FRONTEND] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      toast.error('CRM connection failed: ' + error.message);
    }
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['indiamart-dashboard'],
    queryFn: () => apiClient.getIndiaMartDashboard(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch configuration
  const { data: configData } = useQuery({
    queryKey: ['indiamart-config'],
    queryFn: () => apiClient.getIndiaMartConfig(),
  });

  // Fetch leads
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['indiamart-leads', leadFilters],
    queryFn: () => {
      // Convert "all" status back to empty string for API call
      const apiFilters = { ...leadFilters };
      if (apiFilters.status === 'all') {
        apiFilters.status = '';
      }
      return apiClient.getIndiaMartLeads(apiFilters);
    },
    enabled: activeTab === 'leads'
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: (config: any) => apiClient.saveIndiaMartConfig(config),
    onSuccess: () => {
      toast.success('Configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['indiamart-config'] });
      queryClient.invalidateQueries({ queryKey: ['indiamart-dashboard'] });
      // Clear the CRM key field after successful save
      setConfigForm(prev => ({ ...prev, crmKey: '' }));
      setConfigDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save configuration');
    }
  });

  // Fetch leads mutation
  const fetchLeadsMutation = useMutation({
    mutationFn: () => {
      console.log('🔄 [FRONTEND] Fetch leads mutation triggered');
      console.log('🔄 [FRONTEND] Calling apiClient.fetchIndiaMartLeads()');
      return apiClient.fetchIndiaMartLeads();
    },
    onSuccess: (data) => {
      console.log('✅ [FRONTEND] Fetch leads mutation successful:', data);
      console.log('✅ [FRONTEND] Processed count:', data.processedCount);
      console.log('✅ [FRONTEND] Skipped count:', data.skippedCount);
      console.log('✅ [FRONTEND] Error count:', data.errorCount);
      toast.success(`Fetched ${data.processedCount} new leads`);
      queryClient.invalidateQueries({ queryKey: ['indiamart-leads'] });
      queryClient.invalidateQueries({ queryKey: ['indiamart-dashboard'] });
    },
    onError: (error: any) => {
      console.error('❌ [FRONTEND] Fetch leads mutation failed:', error);
      console.error('❌ [FRONTEND] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(error.message || 'Failed to fetch leads');
    }
  });

  // Update lead status mutation
  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, status, notes, followUpDate }: { leadId: string; status: string; notes: string; followUpDate: string }) => 
      apiClient.updateIndiaMartLeadStatus(leadId, { status, notes, followUpDate }),
    onSuccess: () => {
      toast.success('Lead updated successfully');
      queryClient.invalidateQueries({ queryKey: ['indiamart-leads'] });
      queryClient.invalidateQueries({ queryKey: ['indiamart-dashboard'] });
      setLeadDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update lead');
    }
  });

  // Initialize config form when config data is loaded
  useEffect(() => {
    console.log('Config data received:', configData);
    if (configData?.configured && configData.config) {
      // Handle both old and new data structures
      const config = configData.config;
      setConfigForm({
        crmKey: '', // Always start with empty for security, show masked version separately
        fetchInterval: (config as any).settings?.fetchInterval || (config as any).fetchInterval || 15,
        overlapDuration: (config as any).settings?.overlapDuration || (config as any).overlapDuration || 5,
        autoFetch: config.settings?.autoFetch !== undefined ? config.settings.autoFetch : true,
        retryFailedCalls: config.settings?.retryFailedCalls !== undefined ? config.settings.retryFailedCalls : true,
        maxRetries: config.settings?.maxRetries || 3,
        notifications: config.settings?.notifications !== undefined ? config.settings.notifications : true
      });
    }
  }, [configData]);

  // Debug dialog state
  useEffect(() => {
    console.log('Config dialog open state:', configDialogOpen);
  }, [configDialogOpen]);

  const handleSaveConfig = () => {
    // Only include CRM key if it's provided (for updates) or if no existing config
    const configPayload: any = {
      fetchInterval: configForm.fetchInterval,
      overlapDuration: configForm.overlapDuration,
      settings: {
        autoFetch: configForm.autoFetch,
        retryFailedCalls: configForm.retryFailedCalls,
        maxRetries: configForm.maxRetries,
        notifications: configForm.notifications
      }
    };

    // Only include CRM key if user entered a new one, or if this is initial setup
    if (configForm.crmKey.trim() || !configData?.configured) {
      configPayload.crmKey = configForm.crmKey;
    }

    saveConfigMutation.mutate(configPayload);
  };

  const handleUpdateLead = (lead: IndiaMartLead) => {
    setSelectedLead(lead);
    setLeadDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'converted': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB');
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dashboardData?.configured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IndiaMART Integration</h1>
            <p className="text-muted-foreground">Configure your IndiaMART CRM integration</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Setup Required
            </CardTitle>
            <CardDescription>
              Configure your IndiaMART CRM key to start fetching leads automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To get started, you'll need to generate your CRM key from IndiaMART. 
                Visit your IndiaMART account settings to generate the key.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                onClick={() => {
                  console.log('Configure button clicked!');
                  setConfigDialogOpen(true);
                }} 
                className="flex items-center gap-2"
                type="button"
              >
                <Settings className="h-4 w-4" />
                Configure IndiaMART
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>IndiaMART Configuration</DialogTitle>
              <DialogDescription>
                Configure your IndiaMART CRM integration settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crmKey">CRM Key</Label>
                <Input
                  id="crmKey"
                  type="password"
                  placeholder="Enter your IndiaMART CRM key"
                  value={configForm.crmKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, crmKey: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fetchInterval">Fetch Interval (minutes)</Label>
                  <Input
                    id="fetchInterval"
                    type="number"
                    min="5"
                    max="60"
                    value={configForm.fetchInterval}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, fetchInterval: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlapDuration">Overlap Duration (minutes)</Label>
                  <Input
                    id="overlapDuration"
                    type="number"
                    min="1"
                    max="30"
                    value={configForm.overlapDuration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, overlapDuration: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoFetch">Auto Fetch</Label>
                  <Switch
                    id="autoFetch"
                    checked={configForm.autoFetch}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, autoFetch: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="retryFailedCalls">Retry Failed Calls</Label>
                  <Switch
                    id="retryFailedCalls"
                    checked={configForm.retryFailedCalls}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, retryFailedCalls: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Notifications</Label>
                  <Switch
                    id="notifications"
                    checked={configForm.notifications}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, notifications: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending}
                >
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IndiaMART Integration</h1>
          <p className="text-muted-foreground">Manage your IndiaMART leads and configuration</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchLeadsMutation.mutate()}
            disabled={fetchLeadsMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetchLeadsMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfigDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          {configData?.configured && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">CRM Configured</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.statistics.totalLeads}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.statistics.todayLeads}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.statistics.weekLeads}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.statistics.monthLeads}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Fetch Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Last Fetch:</span>
                <span className="font-medium">
                  {dashboardData.fetchInfo.lastFetch 
                    ? formatDateTime(dashboardData.fetchInfo.lastFetch)
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next Fetch:</span>
                <span className="font-medium">
                  {dashboardData.fetchInfo.nextFetch 
                    ? formatDateTime(dashboardData.fetchInfo.nextFetch)
                    : 'Not scheduled'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time Until Next:</span>
                <span className="font-medium">
                  {dashboardData.fetchInfo.timeUntilNextFetch > 0 
                    ? `${dashboardData.fetchInfo.timeUntilNextFetch} minutes`
                    : 'Due now'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge 
                  variant={dashboardData.fetchInfo.lastApiCallStatus === 'success' ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {dashboardData.fetchInfo.lastApiCallStatus === 'success' ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {dashboardData.fetchInfo.lastApiCallStatus}
                </Badge>
              </div>
              {dashboardData.fetchInfo.lastApiCallError && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {dashboardData.fetchInfo.lastApiCallError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lead Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.statistics.statusCounts && Object.keys(dashboardData.statistics.statusCounts).length > 0 ? (
                  Object.entries(dashboardData.statistics.statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusBadge(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${dashboardData.statistics.totalLeads > 0 ? (count / dashboardData.statistics.totalLeads) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No lead status data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={leadFilters.status}
                    onValueChange={(value) => setLeadFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name-filter">Sender Name</Label>
                  <Input
                    id="name-filter"
                    placeholder="Search by name..."
                    value={leadFilters.senderName}
                    onChange={(e) => setLeadFilters(prev => ({ ...prev, senderName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile-filter">Mobile</Label>
                  <Input
                    id="mobile-filter"
                    placeholder="Search by mobile..."
                    value={leadFilters.senderMobile}
                    onChange={(e) => setLeadFilters(prev => ({ ...prev, senderMobile: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={leadFilters.dateFrom}
                    onChange={(e) => setLeadFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {leadsData ? `${leadsData.pagination.totalCount} total leads` : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query Time</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Query Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsData?.leads && leadsData.leads.length > 0 ? (
                        leadsData.leads.map((lead: IndiaMartLead) => (
                          <TableRow key={lead._id}>
                            <TableCell className="font-medium">
                              {formatDateTime(lead.queryTime)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{lead.senderName}</div>
                                {lead.senderCompany && (
                                  <div className="text-sm text-muted-foreground">{lead.senderCompany}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.senderMobile}
                              </div>
                            </TableCell>
                            <TableCell>{lead.queryType}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusBadge(lead.status)}>
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateLead(lead)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No leads found</p>
                              <p className="text-sm text-muted-foreground">
                                {!dashboardData?.configured 
                                  ? "Configure your IndiaMART integration to start fetching leads"
                                  : "Try adjusting your filters or sync leads manually"
                                }
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.recordsPulled} records pulled
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground">
                      Activity will appear here once you start syncing leads
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>IndiaMART Configuration</DialogTitle>
            <DialogDescription>
              Configure your IndiaMART CRM integration settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crmKey">CRM Key</Label>
              {configData?.configured && configData.config ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Current CRM Key:</span>
                        <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                          {((configData.config as any).crmKey || (configData.config as any).apiKey || '').replace(/./g, '*').slice(0, 20)}...
                        </code>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600 flex-shrink-0">
                      Configured
                    </Badge>
                  </div>
                  <Input
                    id="crmKey"
                    type="password"
                    placeholder="Enter new CRM key to update (leave empty to keep current)"
                    value={configForm.crmKey}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, crmKey: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep your current CRM key, or enter a new one to update it.
                  </p>
                </div>
              ) : (
                <Input
                  id="crmKey"
                  type="password"
                  placeholder="Enter your IndiaMART CRM key"
                  value={configForm.crmKey}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, crmKey: e.target.value }))}
                />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fetchInterval">Fetch Interval (minutes)</Label>
                <Input
                  id="fetchInterval"
                  type="number"
                  min="5"
                  max="60"
                  value={configForm.fetchInterval}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, fetchInterval: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  How often to fetch new leads (5-60 minutes)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overlapDuration">Overlap Duration (minutes)</Label>
                <Input
                  id="overlapDuration"
                  type="number"
                  min="1"
                  max="30"
                  value={configForm.overlapDuration}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, overlapDuration: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Overlap time to avoid missing leads (1-30 minutes)
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="autoFetch">Auto Fetch</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically fetch leads at specified intervals
                  </p>
                </div>
                <Switch
                  id="autoFetch"
                  checked={configForm.autoFetch}
                  onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, autoFetch: checked }))}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="retryFailedCalls">Retry Failed Calls</Label>
                  <p className="text-xs text-muted-foreground">
                    Retry API calls that fail due to network issues
                  </p>
                </div>
                <Switch
                  id="retryFailedCalls"
                  checked={configForm.retryFailedCalls}
                  onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, retryFailedCalls: checked }))}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Show notifications for successful syncs and errors
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={configForm.notifications}
                  onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <div>
                {configData?.configured && (
                  <Button
                    variant="outline"
                    onClick={testCrmConnection}
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    Test CRM Connection
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={saveConfigMutation.isPending || (!configForm.crmKey.trim() && !configData?.configured)}
                >
                  {saveConfigMutation.isPending ? 'Saving...' : 
                   configData?.configured ? 'Update Configuration' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View and update lead information
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Query Time</Label>
                  <p className="text-sm">{formatDateTime(selectedLead.queryTime)}</p>
                </div>
                <div>
                  <Label>Query Type</Label>
                  <p className="text-sm">{selectedLead.queryType}</p>
                </div>
              </div>
              
              <div>
                <Label>Sender Information</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><strong>Name:</strong> {selectedLead.senderName}</p>
                  <p className="text-sm"><strong>Mobile:</strong> {selectedLead.senderMobile}</p>
                  {selectedLead.senderEmail && (
                    <p className="text-sm"><strong>Email:</strong> {selectedLead.senderEmail}</p>
                  )}
                  {selectedLead.senderCompany && (
                    <p className="text-sm"><strong>Company:</strong> {selectedLead.senderCompany}</p>
                  )}
                  {selectedLead.senderAddress && (
                    <p className="text-sm"><strong>Address:</strong> {selectedLead.senderAddress}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Query Message</Label>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedLead.queryMessage}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedLead.status}
                  onValueChange={(value) => setSelectedLead(prev => prev ? { ...prev, status: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this lead..."
                  value={selectedLead.notes || ''}
                  onChange={(e) => setSelectedLead(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={selectedLead.followUpDate ? new Date(selectedLead.followUpDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedLead(prev => prev ? { ...prev, followUpDate: e.target.value } : null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLeadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedLead && updateLeadMutation.mutate({
                    leadId: selectedLead._id,
                    status: selectedLead.status,
                    notes: selectedLead.notes || '',
                    followUpDate: selectedLead.followUpDate || ''
                  })}
                  disabled={updateLeadMutation.isPending}
                >
                  {updateLeadMutation.isPending ? 'Updating...' : 'Update Lead'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndiaMART; 