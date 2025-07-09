import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Play, Pause, Square, Eye, Trash2, Download } from 'lucide-react';
import { apiClient, BulkCampaign, MessageTemplate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function CSVBulkMessaging() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [customMessage, setCustomMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [delayBetweenMessages, setDelayBetweenMessages] = useState('1000');
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  const queryClient = useQueryClient();

  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.getTemplates(),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiClient.getCampaigns(),
  });

  const createCampaignMutation = useMutation({
    mutationFn: (formData: FormData) => apiClient.createCampaignFromCSV(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign created successfully',
        description: 'Your bulk campaign has been created',
      });
      // Reset form
      setCsvFile(null);
      setCampaignName('');
      setCampaignDescription('');
      setCustomMessage('');
      setSelectedTemplate('none');
      setActiveTab('manage');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiClient.startCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign started',
        description: 'Your bulk campaign has been started',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to start campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiClient.pauseCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign status updated',
        description: 'Campaign has been paused/resumed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiClient.deleteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedInstance || !campaignName) return;

    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('instanceId', selectedInstance);
    formData.append('name', campaignName);
    formData.append('description', campaignDescription);
    formData.append('delayBetweenMessages', delayBetweenMessages);
    
    if (selectedTemplate && selectedTemplate !== 'none') {
      formData.append('templateId', selectedTemplate);
    } else if (customMessage) {
      formData.append('message', customMessage);
    }

    createCampaignMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['phoneNumber', 'name', 'firstName', 'lastName', 'company'],
      ['+1234567890', 'John Doe', 'John', 'Doe', 'Acme Corp'],
      ['+0987654321', 'Jane Smith', 'Jane', 'Smith', 'Tech Inc'],
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-bulk-messaging.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const readyDevices = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'create' ? 'default' : 'outline'}
          onClick={() => setActiveTab('create')}
        >
          Create Campaign
        </Button>
        <Button
          variant={activeTab === 'manage' ? 'default' : 'outline'}
          onClick={() => setActiveTab('manage')}
        >
          Manage Campaigns
        </Button>
      </div>

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Create CSV Bulk Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="space-y-6">
              {/* Campaign Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-device">Select Device</Label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a WhatsApp device" />
                    </SelectTrigger>
                    <SelectContent>
                      {readyDevices.map((device) => (
                        <SelectItem key={device.instanceId} value={device.instanceId}>
                          {device.instanceName} ({device.phoneNumber || 'Not connected'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="campaign-description">Description (optional)</Label>
                <Textarea
                  id="campaign-description"
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  placeholder="Describe your campaign"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="delay">Delay Between Messages (ms)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={delayBetweenMessages}
                  onChange={(e) => setDelayBetweenMessages(e.target.value)}
                  min="500"
                  placeholder="1000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 500ms recommended to avoid rate limiting
                </p>
              </div>

              <Separator />

              {/* CSV Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample
                  </Button>
                </div>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required columns: phoneNumber, name (optional). Additional columns can be used as template variables.
                </p>
              </div>

              <Separator />

              {/* Message Content */}
              <div>
                <Label>Message Content</Label>
                <div className="space-y-4">
                                      <div>
                      <Label htmlFor="template-select">Use Template (optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template or write custom message" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template (use custom message)</SelectItem>
                          {templatesData?.templates.map((template) => (
                            <SelectItem key={template._id} value={template._id}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                {template.variables.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {template.variables.length} vars
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  {(selectedTemplate === 'none') && (
                    <div>
                      <Label htmlFor="custom-message">Custom Message</Label>
                      <Textarea
                        id="custom-message"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Enter your message. Use {{variable}} for CSV column values"
                        rows={4}
                        required={selectedTemplate === 'none'}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {"{{columnName}}"} to insert CSV column values into your message
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={createCampaignMutation.isPending || !csvFile || !selectedInstance || !campaignName}
                className="w-full"
              >
                {createCampaignMutation.isPending ? (
                  'Creating Campaign...'
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Bulk Campaign
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'manage' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Campaign Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsData?.campaigns.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns found</p>
                <p className="text-sm text-muted-foreground">Create your first bulk campaign to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaignsData?.campaigns.map((campaign: BulkCampaign) => (
                  <div key={campaign._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {campaign.totalRecipients} recipients
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => startCampaignMutation.mutate(campaign._id)}
                            disabled={startCampaignMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {(campaign.status === 'running' || campaign.status === 'paused') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaignMutation.mutate(campaign._id)}
                            disabled={pauseCampaignMutation.isPending}
                          >
                            {campaign.status === 'running' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCampaignMutation.mutate(campaign._id)}
                            disabled={deleteCampaignMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {campaign.status !== 'draft' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>
                            {campaign.sentCount} / {campaign.totalRecipients} sent
                            {campaign.failedCount > 0 && ` (${campaign.failedCount} failed)`}
                          </span>
                        </div>
                        <Progress 
                          value={(campaign.sentCount / campaign.totalRecipients) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-3 text-xs text-muted-foreground">
                      <p>Created: {new Date(campaign.createdAt).toLocaleString()}</p>
                      {campaign.startedAt && (
                        <p>Started: {new Date(campaign.startedAt).toLocaleString()}</p>
                      )}
                      {campaign.completedAt && (
                        <p>Completed: {new Date(campaign.completedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 