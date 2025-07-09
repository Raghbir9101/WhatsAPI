import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/admin-api';
import { Package, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function AdminPackages() {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: adminApi.getPackages,
  });

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
        <div className="text-sm text-muted-foreground">
          {packages.length} packages available
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-ceo-green" />
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
            <CardContent className="space-y-4">
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
              
              <div className="pt-4 border-t">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Package Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Package Statistics</CardTitle>
          <CardDescription>Usage statistics for each package</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-medium">{pkg.name}</div>
                  <Badge variant="outline">${pkg.price}</Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Popular choice • Most cost-effective
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}