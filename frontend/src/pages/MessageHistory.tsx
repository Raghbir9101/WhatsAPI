import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart3
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
    limit: 50
  });

  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: numbersData } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => apiClient.getNumbers(),
  });

  // Convert "all" values to empty strings for API calls
  const apiFilters = {
    ...filters,
    instanceId: filters.instanceId === 'all' ? '' : filters.instanceId,
    type: filters.type === 'all' ? '' : filters.type
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
    queryKey: ['message-stats', filters.instanceId],
    queryFn: () => apiClient.getMessageStats(apiFilters.instanceId || undefined),
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
      limit: 50
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageCircle className="h-4 w-4" />;
      case 'image': return <div className="h-4 w-4 bg-green-500 rounded"></div>;
      case 'video': return <div className="h-4 w-4 bg-blue-500 rounded"></div>;
      case 'audio': return <div className="h-4 w-4 bg-purple-500 rounded"></div>;
      case 'document': return <div className="h-4 w-4 bg-gray-500 rounded"></div>;
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

  const renderMessageContent = (message: Message) => {
    if (message.type === 'text') {
      return (
        <div className="max-w-md">
          <p className="text-sm">{message.content.text}</p>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          {getMessageTypeIcon(message.type)}
          <span className="text-sm capitalize">{message.type}</span>
          {message.content.caption && (
            <span className="text-xs text-muted-foreground">: {message.content.caption}</span>
          )}
        </div>
      );
    }
  };

  const readyDevices = numbersData?.numbers?.filter(n => n.status === 'ready') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Message History</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchMessages()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {messageStats && (
        <div className="grid gap-4 md:grid-cols-4">
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
                <User className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">{conversationsData?.conversations.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
              </div>

              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div>
                  <Label htmlFor="filter-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="filter-search"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search message content..."
                      className="pl-10"
                    />
                  </div>
                </div>

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
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                  {messagesData && (
                    <Badge variant="secondary">
                      {messagesData.pagination.total} total
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
              ) : messagesData?.messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No messages found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messagesData?.messages.map((message: Message) => (
                    <div
                      key={message._id}
                      className={`border rounded-lg p-4 ${
                        message.direction === 'incoming' 
                          ? 'border-l-4 border-l-green-500 bg-green-50/50' 
                          : 'border-l-4 border-l-blue-500 bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={message.direction === 'incoming' ? 'default' : 'secondary'}>
                              {message.direction}
                            </Badge>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>
                                {message.direction === 'incoming' ? message.from : message.to}
                              </span>
                              {message.contactName && (
                                <span className="font-medium">({message.contactName})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {getMessageTypeIcon(message.type)}
                              <span className="text-xs capitalize">{message.type}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {getStatusIcon(message.status)}
                              <span className="text-xs capitalize">{message.status}</span>
                            </div>
                          </div>

                          <div className="ml-4">
                            {renderMessageContent(message)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.templateId && (
                              <Badge variant="outline" className="text-xs">
                                Template
                              </Badge>
                            )}
                            {message.campaignId && (
                              <Badge variant="outline" className="text-xs">
                                Campaign
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {messagesData && messagesData.pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-4">
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