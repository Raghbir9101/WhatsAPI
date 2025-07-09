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
import { toast } from '@/components/ui/use-toast';
import { Users, Plus, MessageSquare, Crown, Shield, Eye, Send, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  description: string;
  participantCount: number;
  isOwner: boolean;
  createdAt: string;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
}

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  participants: {
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }[];
  participantCount: number;
  isOwner: boolean;
  createdAt: string;
  inviteCode: string;
}

interface WhatsAppInstance {
  instanceId: string;
  instanceName: string;
  phoneNumber?: string;
  isActive: boolean;
  status: string;
}

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);

  // Form states
  const [createGroupForm, setCreateGroupForm] = useState({
    name: '',
    participants: ''
  });
  const [messageForm, setMessageForm] = useState({
    message: ''
  });

  // Loading states
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      loadGroups();
    }
  }, [selectedInstance]);

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
      setError('Failed to load WhatsApp instances');
    }
  };

  const loadGroups = async () => {
    if (!selectedInstance) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getGroups(selectedInstance);
      setGroups(response.groups);
      
      // If there's a message (like WhatsApp not connected), show it
      if (response.message && response.groups.length === 0) {
        toast({
          title: 'Info',
          description: response.message,
          variant: 'default'
        });
      }
    } catch (err: any) {
      console.error('Error loading groups:', err);
      const errorMessage = err.message || 'Failed to load groups';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createGroupForm.name.trim() || !createGroupForm.participants.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setCreatingGroup(true);
    try {
      const participants = createGroupForm.participants
        .split(',')
        .map(phone => phone.trim())
        .filter(phone => phone);

      await apiClient.createGroup({
        instanceId: selectedInstance,
        name: createGroupForm.name,
        participants
      });

      toast({
        title: 'Success',
        description: 'Group created successfully'
      });

      setShowCreateGroup(false);
      setCreateGroupForm({ name: '', participants: '' });
      loadGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      toast({
        title: 'Error',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleViewDetails = async (group: Group) => {
    setSelectedGroup(group);
    setLoadingDetails(true);
    setShowGroupDetails(true);
    
    try {
      const details = await apiClient.getGroupDetails(group.id, selectedInstance);
      setGroupDetails(details);
    } catch (err) {
      console.error('Error loading group details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load group details',
        variant: 'destructive'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedGroup || !messageForm.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    setSendingMessage(true);
    try {
      await apiClient.sendGroupMessage({
        instanceId: selectedInstance,
        groupId: selectedGroup.id,
        message: messageForm.message
      });

      toast({
        title: 'Success',
        description: 'Message sent to group successfully'
      });

      setShowMessageDialog(false);
      setMessageForm({ message: '' });
      setSelectedGroup(null);
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const refreshGroups = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Groups & Channels</h1>
            <p className="text-muted-foreground">Manage your WhatsApp groups and broadcast lists</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Groups & Channels</h1>
            <p className="text-muted-foreground">Manage your WhatsApp groups and broadcast lists</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadGroups}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Groups & Channels</h1>
          <p className="text-muted-foreground">Manage your WhatsApp groups and broadcast lists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshGroups} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button disabled={!selectedInstance}>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={createGroupForm.name}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="participants">Participants (comma-separated phone numbers)</Label>
                  <Textarea
                    id="participants"
                    value={createGroupForm.participants}
                    onChange={(e) => setCreateGroupForm(prev => ({ ...prev, participants: e.target.value }))}
                    placeholder="919876543210, 919876543211, ..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={creatingGroup}>
                    {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Group
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

      {groups.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">
              {!selectedInstance 
                ? 'Please select a WhatsApp instance to view groups' 
                : 'Create or import WhatsApp groups to manage bulk messaging. Make sure your WhatsApp is connected and ready.'}
            </p>
            <Button onClick={() => setShowCreateGroup(true)} disabled={!selectedInstance}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Groups ({groups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{group.participantCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {group.isOwner && (
                          <Badge variant="secondary">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.lastMessage ? (
                        <div className="text-sm">
                          <div className="truncate max-w-32">
                            {group.lastMessage.body}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(group.lastMessage.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No messages</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(group)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowMessageDialog(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Group Details Dialog */}
      <Dialog open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Details</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : groupDetails ? (
            <div className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <p className="text-sm text-muted-foreground">{groupDetails.name}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{groupDetails.description || 'No description'}</p>
              </div>
              <div>
                <Label>Participants ({groupDetails.participantCount})</Label>
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {groupDetails.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">{participant.id}</span>
                      <div className="flex gap-1">
                        {participant.isSuperAdmin && (
                          <Badge variant="destructive" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                        {participant.isAdmin && !participant.isSuperAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Invite Code</Label>
                <p className="text-sm text-muted-foreground font-mono">{groupDetails.inviteCode}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(groupDetails.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group: {selectedGroup?.name}</Label>
              <p className="text-sm text-muted-foreground">
                {selectedGroup?.participantCount} participants
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage}>
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}