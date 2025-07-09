import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Plus, Clock, Send, X, Play, Pause, RefreshCw, Loader2, CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Message, WhatsAppInstance, BulkCampaign } from '@/lib/api';

interface ScheduledMessage {
  messageId: string;
  to: string;
  content: {
    text: string;
  };
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  timestamp: string;
  scheduledAt?: string;
}

export function Schedule() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    to: '',
    message: '',
    scheduledAt: ''
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    message: '',
    csvFile: null as File | null,
    delayBetweenMessages: 2000
  });

  // Loading states
  const [scheduling, setScheduling] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadScheduledMessages();
      loadCampaigns();
    }
  }, [selectedInstance, currentPage]);

  const loadInstances = async () => {
    try {
      const response = await apiClient.getNumbers();
      const activeInstances = response.numbers.filter(
        (instance: WhatsAppInstance) => instance.isActive && instance.status === 'ready'
      );
      setInstances(activeInstances);
      
      if (activeInstances.length > 0) {
        setSelectedInstance(activeInstances[0].instanceId);
      }
    } catch (err) {
      console.error('Error loading instances:', err);
      toast({
        title: 'Error',
        description: 'Failed to load WhatsApp instances',
        variant: 'destructive'
      });
    }
  };

  const loadScheduledMessages = async () => {
    if (!selectedInstance) return;
    
    setLoading(true);
    try {
            const response = await apiClient.getScheduledMessages({
        instanceId: selectedInstance,
        status: 'all',
        page: currentPage,
        limit: 20
      });
      
      setScheduledMessages(response.scheduledMessages as ScheduledMessage[]);
      setTotalPages(response.pagination.pages);
      
      // Show info if no scheduled messages
      if (response.scheduledMessages.length === 0 && currentPage === 1) {
        toast({
          title: 'Info',
          description: 'No scheduled messages found. Create your first scheduled message!',
          variant: 'default'
        });
      }
    } catch (err: any) {
      console.error('Error loading scheduled messages:', err);
      const errorMessage = err.message || 'Failed to load scheduled messages';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await apiClient.getCampaigns({
        page: 1,
        limit: 50
      });
      setCampaigns(response.campaigns);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      // Don't show error toast for campaigns as it's not the main content
    }
  };

  const handleScheduleMessage = async () => {
    if (!scheduleForm.to || !scheduleForm.message || !scheduleForm.scheduledAt) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    const scheduledDate = new Date(scheduleForm.scheduledAt);
    if (scheduledDate <= new Date()) {
      toast({
        title: 'Error',
        description: 'Scheduled time must be in the future',
        variant: 'destructive'
      });
      return;
    }

    setScheduling(true);
    try {
      await apiClient.scheduleMessage({
        instanceId: selectedInstance,
        to: scheduleForm.to,
        message: scheduleForm.message,
        scheduledAt: scheduleForm.scheduledAt
      });

      toast({
        title: 'Success',
        description: 'Message scheduled successfully'
      });

      setShowScheduleDialog(false);
      setScheduleForm({ to: '', message: '', scheduledAt: '' });
      loadScheduledMessages();
    } catch (err) {
      console.error('Error scheduling message:', err);
      toast({
        title: 'Error',
        description: 'Failed to schedule message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setScheduling(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message || !campaignForm.csvFile) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setCreatingCampaign(true);
    try {
      const formData = new FormData();
      formData.append('instanceId', selectedInstance);
      formData.append('name', campaignForm.name);
      formData.append('description', campaignForm.description);
      formData.append('message', campaignForm.message);
      formData.append('csvFile', campaignForm.csvFile);
      formData.append('delayBetweenMessages', campaignForm.delayBetweenMessages.toString());

      await apiClient.createCampaignFromCSV(formData);

      toast({
        title: 'Success',
        description: 'Campaign created successfully'
      });

      setShowCampaignDialog(false);
      setCampaignForm({
        name: '',
        description: '',
        message: '',
        csvFile: null,
        delayBetweenMessages: 2000
      });
      loadCampaigns();
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleCancelScheduled = async (messageId: string) => {
    try {
      await apiClient.cancelScheduledMessage(messageId);
      toast({
        title: 'Success',
        description: 'Scheduled message cancelled'
      });
      loadScheduledMessages();
    } catch (err) {
      console.error('Error cancelling message:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel scheduled message',
        variant: 'destructive'
      });
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      await apiClient.startCampaign(campaignId);
      toast({
        title: 'Success',
        description: 'Campaign started successfully'
      });
      loadCampaigns();
    } catch (err) {
      console.error('Error starting campaign:', err);
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive'
      });
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await apiClient.pauseCampaign(campaignId);
      toast({
        title: 'Success',
        description: 'Campaign paused/resumed successfully'
      });
      loadCampaigns();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      toast({
        title: 'Error',
        description: 'Failed to pause/resume campaign',
        variant: 'destructive'
      });
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadScheduledMessages(), loadCampaigns()]);
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'sent':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'running':
        return <Badge variant="default"><Play className="h-3 w-3 mr-1" />Running</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'paused':
        return <Badge variant="outline"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule & Campaigns</h1>
            <p className="text-muted-foreground">Schedule messages and manage drip campaigns</p>
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
          <h1 className="text-3xl font-bold text-foreground">Schedule & Campaigns</h1>
          <p className="text-muted-foreground">Schedule messages and manage drip campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedInstance}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="to">Phone Number</Label>
                  <Input
                    id="to"
                    value={scheduleForm.to}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="919876543210"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={scheduleForm.message}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    min={getMinDateTime()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleScheduleMessage} disabled={scheduling}>
                    {scheduling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Schedule Message
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Label htmlFor="instance">WhatsApp Instance:</Label>
        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select WhatsApp instance" />
          </SelectTrigger>
          <SelectContent>
            {instances.map((instance) => (
              <SelectItem key={instance.instanceId} value={instance.instanceId}>
                {instance.instanceName} {instance.phoneNumber && `(${instance.phoneNumber})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Messages</TabsTrigger>
          <TabsTrigger value="campaigns">Bulk Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          {scheduledMessages.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                            <h3 className="text-lg font-semibold mb-2">No scheduled messages</h3>
            <p className="text-muted-foreground mb-4">
              {!selectedInstance 
                ? 'Please select a WhatsApp instance to view scheduled messages' 
                : 'Schedule messages for later or create automated drip campaigns. Make sure your WhatsApp is connected and ready.'}
            </p>
                <Button onClick={() => setShowScheduleDialog(true)} disabled={!selectedInstance}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule First Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Messages ({scheduledMessages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Scheduled At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledMessages.map((message) => (
                      <TableRow key={message.messageId}>
                        <TableCell>{message.to}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {message.content.text}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(message.timestamp)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(message.status)}
                        </TableCell>
                        <TableCell>
                          {message.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelScheduled(message.messageId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bulk Campaigns</h3>
              <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedInstance}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Bulk Campaign</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaignDescription">Description (Optional)</Label>
                      <Input
                        id="campaignDescription"
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaignMessage">Message</Label>
                      <Textarea
                        id="campaignMessage"
                        value={campaignForm.message}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Hello {{name}}, this is a bulk message..."
                        rows={4}
                      />
                                             <p className="text-sm text-muted-foreground mt-1">
                         Use {"{{name}}"} for personalization based on CSV columns
                       </p>
                    </div>
                    <div>
                      <Label htmlFor="csvFile">CSV File</Label>
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, csvFile: e.target.files?.[0] || null }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        CSV should have columns: phoneNumber, name, and any custom fields
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="delay">Delay Between Messages (ms)</Label>
                      <Input
                        id="delay"
                        type="number"
                        min="1000"
                        max="10000"
                        value={campaignForm.delayBetweenMessages}
                        onChange={(e) => setCampaignForm(prev => ({ ...prev, delayBetweenMessages: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCampaign} disabled={creatingCampaign}>
                        {creatingCampaign ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {campaigns.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create bulk campaigns to send messages to multiple recipients
                  </p>
                  <Button onClick={() => setShowCampaignDialog(true)} disabled={!selectedInstance}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {campaign.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{campaign.totalRecipients}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Sent: {campaign.sentCount}</div>
                              <div>Failed: {campaign.failedCount}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCampaignStatusBadge(campaign.status)}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(campaign.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {campaign.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartCampaign(campaign._id)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {(campaign.status === 'running' || campaign.status === 'paused') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseCampaign(campaign._id)}
                                >
                                  {campaign.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}