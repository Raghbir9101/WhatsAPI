import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { adminApi, type Package } from '@/lib/admin-api';
import { Package as PackageIcon, CreditCard, Clock, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function AdminPackages() {
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    credits: '',
    price: '',
    validityDays: '',
    features: ['']
  });

  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: adminApi.getPackages,
  });

  const resetForm = () => {
    setPackageForm({
      name: '',
      credits: '',
      price: '',
      validityDays: '',
      features: ['']
    });
    setEditingPackage(null);
  };

  const openAddDialog = () => {
    resetForm();
    setPackageDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    if (!pkg) {
      toast({
        title: 'Error',
        description: 'Invalid package selected',
        variant: 'destructive'
      });
      return;
    }

    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || '',
      credits: pkg.credits?.toString() || '',
      price: pkg.price?.toString() || '',
      validityDays: pkg.validityDays?.toString() || '',
      features: pkg.features?.length ? [...pkg.features] : ['']
    });
    setPackageDialogOpen(true);
  };

  const openDeleteDialog = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...packageForm.features];
    newFeatures[index] = value;
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  const addFeature = () => {
    setPackageForm({ ...packageForm, features: [...packageForm.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = packageForm.features.filter((_, i) => i !== index);
    setPackageForm({ ...packageForm, features: newFeatures });
  };

  const packageSaveMutation = useMutation({
    mutationFn: (data: any) => 
      editingPackage 
        ? adminApi.updatePackage(editingPackage._id, data)
        : adminApi.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ 
        title: 'Success', 
        description: `Package ${editingPackage ? 'updated' : 'created'} successfully` 
      });
      setPackageDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to save package',
        variant: 'destructive'
      });
    }
  });

  const packageDeleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
      toast({ 
        title: 'Success', 
        description: 'Package deleted successfully' 
      });
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete package',
        variant: 'destructive'
      });
    }
  });

  const handleSavePackage = () => {
    // Validate required fields
    if (!packageForm.name || !packageForm.credits || !packageForm.price || !packageForm.validityDays) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const packageData = {
      name: packageForm.name.trim(),
      credits: parseInt(packageForm.credits, 10),
      price: parseFloat(packageForm.price),
      validityDays: parseInt(packageForm.validityDays, 10),
      features: packageForm.features.filter(f => f.trim() !== '')
    };

    // Validate parsed values
    if (isNaN(packageData.credits) || isNaN(packageData.price) || isNaN(packageData.validityDays)) {
      toast({
        title: 'Error',
        description: 'Invalid numeric values entered',
        variant: 'destructive'
      });
      return;
    }

    packageSaveMutation.mutate(packageData);
  };

  const handleDeletePackage = () => {
    if (!packageToDelete || !packageToDelete._id) {
      toast({
        title: 'Error',
        description: 'No package selected for deletion',
        variant: 'destructive'
      });
      return;
    }

    packageDeleteMutation.mutate(packageToDelete._id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ceo-black">Package Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {packages.length} packages available
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg._id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-ceo-green" />
                  {pkg.name}
                </CardTitle>
                <Badge variant="outline" className="text-ceo-green border-ceo-green">
                  ${pkg.price}
                </Badge>
              </div>
              <CardDescription>
                {formatNumber(pkg.credits)} credits • {pkg.validityDays} days validity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 h-full">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{formatNumber(pkg.credits)} credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{pkg.validityDays} days</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="space-y-1">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-ceo-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-4 border-t flex justify-between items-center ">
                <div>
                  <div className="text-2xl font-bold text-ceo-green">
                    ${pkg.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.credits * 1000).toFixed(3)} per 1K messages
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(pkg)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? 'Update package details' : 'Create a new subscription package'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input
                  id="pkg-name"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g., PREMIUM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-credits">Credits</Label>
                <Input
                  id="pkg-credits"
                  type="number"
                  value={packageForm.credits}
                  onChange={(e) => setPackageForm({ ...packageForm, credits: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-price">Price ($)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                  placeholder="199"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pkg-validity">Validity (Days)</Label>
                <Input
                  id="pkg-validity"
                  type="number"
                  value={packageForm.validityDays}
                  onChange={(e) => setPackageForm({ ...packageForm, validityDays: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Features</Label>
              {packageForm.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder="Enter feature"
                  />
                  {packageForm.features.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addFeature}
                type="button"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePackage}>
              {editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Package Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{packageToDelete?.name}</strong> package?
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently remove this package</li>
                <li>Affect clients currently using this package</li>
                <li>Cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePackage}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}