import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  User, 
  ArrowUpDown,
  Download,
  RefreshCw,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Upload,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Eye,
  Plus
} from 'lucide-react';
import { apiClient, Message } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export function MessageHistory() {
  const [filters, setFilters] = useState({
    instanceId: 'all',
    direction: 'all' as 'all' | 'incoming' | 'outgoing',
    type: 'all',
    search: '',
    from: '',
    to: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
    source: 'all' as 'all' | 'api' | 'frontend' // New filter for message source
  });

  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'document'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  // Convert "all" values to empty strings for API calls
  const apiFilters = {
    ...filters,
    instanceId: filters.instanceId === 'all' ? '' : filters.instanceId,
    type: filters.type === 'all' ? '' : filters.type,
    source: filters.source === 'all' ? '' : filters.source
  };

  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', filters],
    queryFn: () => apiClient.getMessages(apiFilters),
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', filters.instanceId],
    queryFn: () => apiClient.getConversations(apiFilters.instanceId || undefined),
  });

  const { data: messageStats } = useQuery({
    queryKey: ['message-stats', filters.instanceId, filters.source],
    queryFn: () => apiClient.getMessageStats(apiFilters.instanceId || undefined, apiFilters.source || undefined),
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert file to base64 for Cloudinary upload
      const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      const base64File = await toBase64(file);
      
      const response = await fetch('/api/upload/base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          base64File,
          type: uploadType
        })
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `${uploadType} uploaded and ready to use in messages. URL: ${data.url?.substring(0, 50)}...`
      });
      setSelectedFile(null);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      setIsUploading(false);
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      instanceId: 'all',
      direction: 'all',
      type: 'all',
      search: '',
      from: '',
      to: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50,
      source: 'all'
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageCircle className="h-4 w-4" />;
      case 'image': return <FileImage className="h-4 w-4 text-green-500" />;
      case 'video': return <FileVideo className="h-4 w-4 text-blue-500" />;
      case 'audio': return <FileAudio className="h-4 w-4 text-purple-500" />;
      case 'document': return <FileText className="h-4 w-4 text-gray-500" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'read': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderFilePreview = (message: Message) => {
    if (!message.fileUrl) return null;

    const fileExtension = message.fileUrl.split('.').pop()?.toLowerCase();
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            View File
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {message.type === 'image' && (
              <img 
                src={message.fileUrl} 
                alt="Message attachment" 
                className="max-w-full max-h-96 object-contain"
              />
            )}
            {message.type === 'video' && (
              <video 
                src={message.fileUrl} 
                controls 
                className="max-w-full max-h-96"
              />
            )}
            {message.type === 'audio' && (
              <audio src={message.fileUrl} controls />
            )}
            {message.type === 'document' && (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">Document: {message.fileName || 'Document'}</p>
                <Button asChild>
                  <a href={message.fileUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderMessageContent = (message: Message) => {
    return (
      <div className="space-y-2">
        {message.type === 'text' ? (
          <p className="text-sm">{message.content.text}</p>
        ) : (
          <div className="flex items-center gap-2">
            {getMessageTypeIcon(message.type)}
            <span className="text-sm capitalize">{message.type}</span>
            {message.content.caption && (
              <span className="text-xs text-muted-foreground">: {message.content.caption}</span>
            )}
          </div>
        )}
        {message.fileUrl && renderFilePreview(message)}
      </div>
    );
  };

  const readyDevices = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  // Filter messages by source for separate tabs
  const apiMessages = messagesData?.messages.filter(msg => msg.source === 'api') || [];
  const frontendMessages = messagesData?.messages.filter(msg => msg.source === 'frontend') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Message History</h1>
        <div className="flex gap-2">
          {/* File Upload Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="upload-type">File Type</Label>
                  <Select value={uploadType} onValueChange={(value: 'image' | 'video' | 'document') => setUploadType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : '*'}
                  />
                </div>
                
                {selectedFile && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={!selectedFile || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={() => refetchMessages()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {messageStats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{messageStats.totalMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Incoming</p>
                  <p className="text-2xl font-bold">{messageStats.incomingMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Outgoing</p>
                  <p className="text-2xl font-bold">{messageStats.outgoingMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">API Messages</p>
                  <p className="text-2xl font-bold">{messageStats.apiMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Frontend Messages</p>
                  <p className="text-2xl font-bold">{messageStats.frontendMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="api">API Messages</TabsTrigger>
          <TabsTrigger value="frontend">Frontend Messages</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        {/* Filters Card - Shared across all tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <Label htmlFor="filter-device">Device</Label>
                <Select value={filters.instanceId} onValueChange={(value) => handleFilterChange('instanceId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All devices</SelectItem>
                    {readyDevices.map((device) => (
                      <SelectItem key={device.instanceId} value={device.instanceId}>
                        {device.instanceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-direction">Direction</Label>
                <Select value={filters.direction} onValueChange={(value) => handleFilterChange('direction', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All messages</SelectItem>
                    <SelectItem value="incoming">Incoming only</SelectItem>
                    <SelectItem value="outgoing">Outgoing only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-type">Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-from">From</Label>
                <Input
                  id="filter-from"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="filter-to">To</Label>
                <Input
                  id="filter-to"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="filter-search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-search"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search content..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <div>
                <Label htmlFor="filter-start-date">Start Date</Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filter-end-date">End Date</Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Table Component */}
        {['all', 'api', 'frontend'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {tabValue === 'all' ? 'All Messages' : 
                     tabValue === 'api' ? 'API Messages' : 'Frontend Messages'}
                    {messagesData && (
                      <Badge variant="secondary">
                        {tabValue === 'all' ? messagesData.pagination.total :
                         tabValue === 'api' ? apiMessages.length : frontendMessages.length} messages
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Type</TableHead>
                          <TableHead className="w-24">Direction</TableHead>
                          <TableHead className="w-32">From/To</TableHead>
                          <TableHead className="flex-1">Content</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-32">Source</TableHead>
                          <TableHead className="w-40">Timestamp</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(
                          tabValue === 'all' ? messagesData?.messages || [] :
                          tabValue === 'api' ? apiMessages : frontendMessages
                        ).map((message: Message) => (
                          <TableRow key={message._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getMessageTypeIcon(message.type)}
                                <span className="text-xs capitalize">{message.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={message.direction === 'incoming' ? 'default' : 'secondary'}>
                                {message.direction}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {message.direction === 'incoming' ? message.from : message.to}
                                </div>
                                {message.contactName && (
                                  <div className="text-xs text-muted-foreground">
                                    {message.contactName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                {renderMessageContent(message)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(message.status)}
                                <span className="text-xs capitalize">{message.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                message.source === 'api' ? 'border-purple-200 text-purple-700' : 
                                'border-cyan-200 text-cyan-700'
                              }>
                                {message.source || 'frontend'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {formatTimestamp(message.timestamp)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {message.fileUrl && (
                                  message.type === 'image' ? (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <div className="cursor-pointer">
                                          <img 
                                            src={message.fileUrl} 
                                            alt="Message attachment" 
                                            className="w-16 h-16 object-cover rounded border"
                                          />
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl">
                                        <DialogHeader>
                                          <DialogTitle>Image Preview</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex justify-center">
                                          <img 
                                            src={message.fileUrl} 
                                            alt="Message attachment" 
                                            className="max-w-full max-h-[80vh] object-contain"
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  ) : message.type === 'video' ? (
                                    <video 
                                      src={message.fileUrl} 
                                      controls 
                                      className="w-16 h-16 rounded border"
                                      preload="metadata"
                                    />
                                  ) : message.type === 'audio' ? (
                                    <audio src={message.fileUrl} controls className="w-32" />
                                  ) : (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={message.fileUrl} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </a>
                                    </Button>
                                  )
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {(tabValue === 'all' ? messagesData?.messages.length : 
                      tabValue === 'api' ? apiMessages.length : frontendMessages.length) === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No messages found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {messagesData && messagesData.pagination.pages > 1 && tabValue === 'all' && (
                      <div className="flex items-center justify-between p-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((messagesData.pagination.page - 1) * messagesData.pagination.limit) + 1} to{' '}
                          {Math.min(messagesData.pagination.page * messagesData.pagination.limit, messagesData.pagination.total)} of{' '}
                          {messagesData.pagination.total} messages
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={messagesData.pagination.page === 1}
                            onClick={() => handleFilterChange('page', (messagesData.pagination.page - 1).toString())}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={messagesData.pagination.page === messagesData.pagination.pages}
                            onClick={() => handleFilterChange('page', (messagesData.pagination.page + 1).toString())}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversationsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : conversationsData?.conversations.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversationsData?.conversations.map((conversation) => (
                    <div key={`${conversation.contact}-${conversation.instanceId}`} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <p className="font-medium">
                                {conversation.contactName || conversation.contact}
                              </p>
                              <p className="text-sm text-muted-foreground">{conversation.contact}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                {conversation.messageCount} messages
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive">
                                  {conversation.unreadCount} unread
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-muted rounded">
                            <p className="text-sm">
                              {conversation.lastMessage.content.text || 
                               `${conversation.lastMessage.type} message`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(conversation.lastMessage.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 