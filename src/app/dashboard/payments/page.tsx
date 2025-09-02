"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Payments Management</h2>
              <p className="text-muted-foreground">Handle payment processing and transactions</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
              <CardDescription>Transaction history and payment management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Payments management interface coming soon...
              </div>
            </CardContent>
          </Card>
    </div>
  );
}