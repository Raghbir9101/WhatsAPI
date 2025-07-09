import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Phone, 
  QrCode, 
  Power, 
  PowerOff, 
  Trash2, 
  MessageSquare,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { apiClient, WhatsAppInstance } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

export const Numbers: React.FC = () => {
  const [numbers, setNumbers] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const [newNumber, setNewNumber] = useState({
    instanceName: '',
    description: '',
  });

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const response = await apiClient.getNumbers();
      setNumbers(response.numbers);
    } catch (error) {
      toast({
        title: 'Failed to load numbers',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiClient.addNumber(newNumber);
      toast({
        title: 'Number added successfully',
        description: 'Your WhatsApp number instance has been created.',
      });
      setNewNumber({ instanceName: '', description: '' });
      setAddDialogOpen(false);
      fetchNumbers();
    } catch (error) {
      toast({
        title: 'Failed to add number',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleInitialize = async (instanceId: string, instanceName: string) => {
    try {
      await apiClient.initializeNumber(instanceId);
      toast({
        title: 'Initializing connection',
        description: 'WhatsApp client is starting up...',
      });
      setSelectedInstanceId(instanceId);
      setSelectedInstanceName(instanceName);
      setQrDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Failed to initialize',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (instanceId: string) => {
    try {
      await apiClient.disconnectNumber(instanceId);
      toast({
        title: 'Number disconnected',
        description: 'WhatsApp number has been disconnected.',
      });
      fetchNumbers();
    } catch (error) {
      toast({
        title: 'Failed to disconnect',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (instanceId: string) => {
    try {
      await apiClient.deleteNumber(instanceId);
      toast({
        title: 'Number deleted',
        description: 'WhatsApp number instance has been deleted.',
      });
      fetchNumbers();
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { label: 'Connected', variant: 'default' as const, className: 'bg-success text-white' },
      qr_ready: { label: 'QR Ready', variant: 'secondary' as const, className: 'bg-warning text-white' },
      initializing: { label: 'Initializing', variant: 'secondary' as const, className: 'bg-info text-white' },
      disconnected: { label: 'Disconnected', variant: 'outline' as const, className: 'text-error border-error' },
      auth_failed: { label: 'Auth Failed', variant: 'destructive' as const, className: '' },
      not_initialized: { label: 'Not Started', variant: 'outline' as const, className: '' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_initialized;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const refreshNumbers = () => {
    setRefreshing(true);
    fetchNumbers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-4"></div>
          <p className="text-whatsapp-gray">Loading WhatsApp numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-whatsapp-dark">WhatsApp Numbers</h1>
          <p className="text-whatsapp-gray">
            Manage your WhatsApp number instances
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshNumbers}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-whatsapp-green hover:bg-whatsapp-green-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add WhatsApp Number</DialogTitle>
                <DialogDescription>
                  Create a new WhatsApp number instance for messaging
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddNumber} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Instance Name</Label>
                  <Input
                    id="instanceName"
                    placeholder="e.g., Main Business Number"
                    value={newNumber.instanceName}
                    onChange={(e) => setNewNumber({ ...newNumber, instanceName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this number's purpose"
                    value={newNumber.description}
                    onChange={(e) => setNewNumber({ ...newNumber, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-whatsapp-green hover:bg-whatsapp-green-hover">
                    Add Number
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {numbers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Phone className="h-12 w-12 text-whatsapp-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-whatsapp-dark mb-2">
              No WhatsApp Numbers
            </h3>
            <p className="text-whatsapp-gray mb-6">
              Add your first WhatsApp number to start sending messages
            </p>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Number
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {numbers.map((number) => (
            <Card key={number.instanceId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-whatsapp-green" />
                      {number.instanceName}
                      {getStatusBadge(number.status)}
                    </CardTitle>
                    <CardDescription>
                      {number.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {number.status === 'not_initialized' && (
                      <Button
                        onClick={() => handleInitialize(number.instanceId, number.instanceName)}
                        size="sm"
                        className="bg-whatsapp-green hover:bg-whatsapp-green-hover"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    )}
                    
                    {(number.status === 'qr_ready' || number.status === 'initializing') && (
                      <Button
                        onClick={() => {
                          setSelectedInstanceId(number.instanceId);
                          setSelectedInstanceName(number.instanceName);
                          setQrDialogOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR
                      </Button>
                    )}
                    
                    {number.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <PowerOff className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect WhatsApp Number</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will disconnect {number.instanceName} from WhatsApp. 
                              You'll need to scan the QR code again to reconnect.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(number.instanceId)}
                              className="bg-warning hover:bg-warning/90"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete WhatsApp Number</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {number.instanceName} and all its data. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(number.instanceId)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-whatsapp-gray" />
                    <div>
                      <p className="text-sm font-medium">Phone Number</p>
                      <p className="text-sm text-whatsapp-gray">
                        {number.phoneNumber ? `+${number.phoneNumber}` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-whatsapp-gray" />
                    <div>
                      <p className="text-sm font-medium">Messages Sent</p>
                      <p className="text-sm text-whatsapp-gray">{number.messagesSent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-whatsapp-gray" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-whatsapp-gray">
                        {number.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-whatsapp-gray" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-whatsapp-gray">
                        {new Date(number.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp</DialogTitle>
            <DialogDescription>
              Scan the QR code with your WhatsApp to connect this number
            </DialogDescription>
          </DialogHeader>
          {selectedInstanceId && (
            <QRCodeDisplay
              instanceId={selectedInstanceId}
              instanceName={selectedInstanceName}
              onStatusChange={(status) => {
                if (status === 'ready') {
                  setQrDialogOpen(false);
                  fetchNumbers();
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};