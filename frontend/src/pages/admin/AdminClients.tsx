import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { adminApi, type Client } from '@/lib/admin-api';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Plus, 
  Calendar,
  CreditCard,
  UserX,
  UserCheck,
  Clock
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function AdminClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [addCredits, setAddCreditsAmount] = useState('1000');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'extend' | 'credits' | 'details'>('details');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState<Client | null>(null);

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: adminApi.getClients,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' }) =>
      adminApi.updateClientStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Success', description: 'Client status updated' });
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      adminApi.extendClientValidity(id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Success', description: 'Client validity extended' });
      setDialogOpen(false);
    },
  });

  const creditsMutation = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      adminApi.addCredits(id, credits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Success', description: 'Credits added successfully' });
      setDialogOpen(false);
    },
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={cn(variants[status as keyof typeof variants])}>
        {status}
      </Badge>
    );
  };

  const getExpiryStatus = (validityDate: string) => {
    const today = new Date();
    const expiry = new Date(validityDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { text: 'Expired', color: 'text-red-600' };
    if (daysUntilExpiry <= 7) return { text: `${daysUntilExpiry} days left`, color: 'text-orange-600' };
    return { text: `${daysUntilExpiry} days left`, color: 'text-green-600' };
  };

  const openDialog = (client: Client, type: 'extend' | 'credits' | 'details') => {
    setSelectedClient(client);
    setActionType(type);
    setDialogOpen(true);
  };

  const openSuspendDialog = (client: Client) => {
    setClientToSuspend(client);
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = () => {
    if (clientToSuspend) {
      statusMutation.mutate({ id: clientToSuspend.id, status: 'SUSPENDED' });
      setSuspendDialogOpen(false);
      setClientToSuspend(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ceo-black">Client Management</h1>
        <div className="text-sm text-muted-foreground">
          {filteredClients.length} of {clients.length} clients
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Clients</CardTitle>
          <CardDescription>Search by name, email, or company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>Manage all registered clients and their subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const expiryStatus = getExpiryStatus(client.validityDate);
                const usagePercent = Math.round((client.creditsUsed / client.creditsTotal) * 100);
                
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.company}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.package}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{client.validityDate}</div>
                        <div className={cn('text-xs', expiryStatus.color)}>
                          {expiryStatus.text}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">
                          {formatNumber(client.creditsRemaining)} / {formatNumber(client.creditsTotal)}
                        </div>
                        <div className="w-16 bg-muted rounded-full h-1 mt-1">
                          <div 
                            className="bg-ceo-green h-1 rounded-full"
                            style={{ width: `${Math.min(100 - usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatNumber(client.messagesSent)} sent</div>
                        <div className="text-xs text-muted-foreground">{usagePercent}% used</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDialog(client, 'details')}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog(client, 'extend')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Extend Validity
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog(client, 'credits')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Credits
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {client.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => openSuspendDialog(client)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => statusMutation.mutate({ id: client.id, status: 'ACTIVE' })}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'details' && 'Client Details'}
              {actionType === 'extend' && 'Extend Validity'}
              {actionType === 'credits' && 'Add Credits'}
            </DialogTitle>
            <DialogDescription>
              {selectedClient && (
                <>
                  Managing {selectedClient.name} ({selectedClient.email})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-4">
              {actionType === 'details' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <div className="text-sm">{selectedClient.name}</div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="text-sm">{selectedClient.email}</div>
                  </div>
                  <div>
                    <Label>Company</Label>
                    <div className="text-sm">{selectedClient.company}</div>
                  </div>
                  <div>
                    <Label>Package</Label>
                    <div className="text-sm">{selectedClient.package}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="text-sm">{getStatusBadge(selectedClient.status)}</div>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <div className="text-sm">{selectedClient.createdAt}</div>
                  </div>
                  <div>
                    <Label>Last Login</Label>
                    <div className="text-sm">{selectedClient.lastLogin}</div>
                  </div>
                  <div>
                    <Label>WhatsApp Numbers</Label>
                    <div className="text-sm">{selectedClient.whatsappInstances}</div>
                  </div>
                </div>
              )}
              
              {actionType === 'extend' && (
                <div className="space-y-2">
                  <Label htmlFor="extend-days">Extend by (days)</Label>
                  <Input
                    id="extend-days"
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    placeholder="30"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current expiry: {selectedClient.validityDate}
                  </div>
                </div>
              )}
              
              {actionType === 'credits' && (
                <div className="space-y-2">
                  <Label htmlFor="add-credits">Credits to add</Label>
                  <Input
                    id="add-credits"
                    type="number"
                    value={addCredits}
                    onChange={(e) => setAddCreditsAmount(e.target.value)}
                    placeholder="1000"
                  />
                  <div className="text-sm text-muted-foreground">
                    Current: {formatNumber(selectedClient.creditsRemaining)} / {formatNumber(selectedClient.creditsTotal)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {actionType === 'extend' && (
              <Button
                onClick={() => extendMutation.mutate({ 
                  id: selectedClient!.id, 
                  days: parseInt(extendDays) 
                })}
                disabled={extendMutation.isPending}
              >
                {extendMutation.isPending ? 'Extending...' : 'Extend Validity'}
              </Button>
            )}
            {actionType === 'credits' && (
              <Button
                onClick={() => creditsMutation.mutate({ 
                  id: selectedClient!.id, 
                  credits: parseInt(addCredits) 
                })}
                disabled={creditsMutation.isPending}
              >
                {creditsMutation.isPending ? 'Adding...' : 'Add Credits'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Client Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <strong>{clientToSuspend?.name}</strong> ({clientToSuspend?.email})?
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Immediately disable their account access</li>
                <li>Stop all active WhatsApp instances</li>
                <li>Prevent them from sending messages</li>
                <li>Block API access until reactivated</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Suspend Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}