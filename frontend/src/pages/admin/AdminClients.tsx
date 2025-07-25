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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { adminApi, type Client, type AssignedPackage } from '@/lib/admin-api';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Plus, 
  Calendar,
  CreditCard,
  UserX,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function AdminClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [addCredits, setAddCreditsAmount] = useState('1000');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'extend' | 'credits' | 'details'>('details');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [clientToSuspend, setClientToSuspend] = useState<Client | null>(null);
  const [packageAssignDialogOpen, setPackageAssignDialogOpen] = useState(false);
  const [selectedPackageToAssign, setSelectedPackageToAssign] = useState<string>('');
  const [clientToAssignPackage, setClientToAssignPackage] = useState<Client | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clients', page, searchTerm],
    queryFn: () => adminApi.getClients(page, limit, searchTerm),
  });

  const clients = data?.clients || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  };

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

  const { data: packages = [] } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: adminApi.getPackages,
  });

  const packageAssignMutation = useMutation({
    mutationFn: ({ clientId, packageId }: { clientId: string; packageId: string }) =>
      adminApi.assignPackageToClient(clientId, packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast({ title: 'Success', description: 'Package assigned successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to assign package',
        variant: 'destructive'
      });
    }
  });

  const filteredClients = clients;

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

  const getActivePackages = (assignedPackages: any[]) => {
    const now = new Date();
    return assignedPackages.filter(pkg => {
      const lastDate = new Date(pkg.lastDate);
      return lastDate > now && pkg.package;
    });
  };

  const getFarthestValidityDate = (assignedPackages: AssignedPackage[]) => {
    const activePackages = getActivePackages(assignedPackages);
    if (activePackages.length === 0) return null;
    
    return activePackages.reduce((latest, pkg) => {
      const currentDate = new Date(pkg.lastDate);
      const latestDate = latest ? new Date(latest) : new Date(0);
      return currentDate > latestDate ? pkg.lastDate : latest;
    }, null);
  };

  const renderPackages = (packages: any[]) => {
    if (packages.length === 0) return <Badge variant="destructive">No Active Packages</Badge>;
    
    return packages.map((pkg, index) => (
      //non active packages should be grey
      <div key={pkg.package._id} className="flex items-center space-x-2 m-1">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className={`${pkg.lastDate < new Date() ? 'bg-gray-200 text-gray-800' : ''}`}>
              {pkg.package.name}
            </Badge>
            <TooltipContent>
              Valid until {new Date(pkg.lastDate).toLocaleDateString()}
            </TooltipContent>
          </TooltipTrigger>
        </Tooltip>
        
      </div>
    ));
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

  const openPackageAssignDialog = (client: Client) => {
    setClientToAssignPackage(client);
    setSelectedPackageToAssign('');
    setPackageAssignDialogOpen(true);
  };

  const handlePackageAssign = () => {
    if (!clientToAssignPackage || !selectedPackageToAssign) {
      toast({
        title: 'Error',
        description: 'Please select a package',
        variant: 'destructive'
      });
      return;
    }

    packageAssignMutation.mutate({
      clientId: clientToAssignPackage.id, 
      packageId: selectedPackageToAssign
    }, {
      onSuccess: () => {
        setPackageAssignDialogOpen(false);
        setClientToAssignPackage(null);
        setSelectedPackageToAssign('');
      }
    });
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
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ceo-black">Client Management</h1>
          <div className="text-sm text-muted-foreground">
            {pagination.total} total clients
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on new search
                }}
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
                  const activePackages = getActivePackages(client.assignedPackages);
                  const primaryPackage = activePackages[0]?.package;
                  const creditsTotal = primaryPackage?.credits || client.creditsTotal;
                  const usagePercent = Math.round((client.creditsUsed / creditsTotal) * 100);
                  
                  const farthestValidityDate = getFarthestValidityDate(client.assignedPackages) || client.validityDate;

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
                        {renderPackages(activePackages)}
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{new Date(farthestValidityDate).toLocaleDateString()}</div>
                          <div className={cn('text-xs', getExpiryStatus(farthestValidityDate).color)}>
                            {getExpiryStatus(farthestValidityDate).text}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                        <div>
                          <div className="text-sm">
                            {formatNumber(client.creditsRemaining)} / {formatNumber(creditsTotal)}
                          </div>
                          <div className="w-16 bg-muted rounded-full h-1 mt-1">
                            <div 
                              className="bg-ceo-green h-1 rounded-full"
                              style={{ width: `${Math.min(100 - usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {client.creditsRemaining} / {creditsTotal}
                        </TooltipContent>
                        </Tooltip>
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
                            {/* <DropdownMenuItem onClick={() => openDialog(client, 'extend')}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Extend Validity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDialog(client, 'credits')}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Credits
                            </DropdownMenuItem> */}
                            <DropdownMenuSeparator />
                            {packages.length > 0 && (
                              <DropdownMenuItem 
                                onClick={() => openPackageAssignDialog(client)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Package
                              </DropdownMenuItem>
                            )}
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
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
                      <Label>Packages</Label>
                      <div className="space-y-2">
                        {renderPackages(getActivePackages(selectedClient.assignedPackages))}
                      </div>
                    </div>
                    <div>
                      <Label>Package Details</Label>
                      {(() => {
                        const activePackages = getActivePackages(selectedClient.assignedPackages);
                        const primaryPackage = activePackages[0]?.package;
                        
                        if (!primaryPackage) {
                          return <div className="text-sm text-muted-foreground">No active package</div>;
                        }
                        
                        return (
                          <div className="text-sm space-y-1">
                            <div>Price: {primaryPackage.price} {primaryPackage.currency}</div>
                            <div>Billing: {primaryPackage.billingPeriod}</div>
                            <div>Support: {primaryPackage.supportLevel}</div>
                          </div>
                        );
                      })()}
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
                    <div>
                      <Label>Validity</Label>
                      <div className="text-sm">
                        {getFarthestValidityDate(selectedClient.assignedPackages) || selectedClient.validityDate}
                      </div>
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

        {/* Package Assignment Dialog */}
        <Dialog open={packageAssignDialogOpen} onOpenChange={setPackageAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Package to {clientToAssignPackage?.name}</DialogTitle>
              <DialogDescription>
                Select a package to assign to {clientToAssignPackage?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="package-to-assign" className="text-right">
                  Package
                </Label>
                <select
                  id="package-to-assign"
                  value={selectedPackageToAssign}
                  onChange={(e) => setSelectedPackageToAssign(e.target.value)}
                  className="col-span-3"
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPackageAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePackageAssign} disabled={packageAssignMutation.isPending}>
                {packageAssignMutation.isPending ? 'Assigning...' : 'Assign Package'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}