"use client";

import { useState, useEffect } from "react";
import { Building2, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizationSelectorProps {
  className?: string;
}

export function OrganizationSelector({ className }: OrganizationSelectorProps) {
  const { data: organizations, isPending, error } = authClient.useListOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  // Handle organization selection
  const handleOrganizationChange = async (orgId: string) => {
    try {
      setSelectedOrgId(orgId);
      
      // Switch to the selected organization using Better Auth
      const result = await authClient.organization.setActive({
        organizationId: orgId
      });
      
      if (result.error) {
        console.error("Failed to switch organization:", result.error);
      } else {
        // Optionally refresh the page or update app state
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch organization:", err);
    }
  };

  // Automatically set the first organization as active if none is selected
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrgId) {
      const firstOrgId = organizations[0].id;
      setSelectedOrgId(firstOrgId);
      
      // Auto-set first organization as active
      authClient.organization.setActive({
        organizationId: firstOrgId
      }).then((result) => {
        if (result.error) {
          console.error("Failed to auto-set first organization:", result.error);
        }
      }).catch((err) => {
        console.error("Failed to auto-set first organization:", err);
      });
    }
  }, [organizations, selectedOrgId]);

  // Get the currently active organization from selectedOrgId or default to first org
  const activeOrgId = selectedOrgId || (organizations && organizations.length > 0 ? organizations[0].id : "");
  const selectedOrg = organizations?.find(org => org.id === (selectedOrgId || activeOrgId));

  if (isPending) {
    return (
      <div className={`flex items-center gap-2 p-2 ${className}`}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 text-destructive ${className}`}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm truncate group-data-[collapsible=icon]:hidden">Failed to load organizations</span>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className={`flex items-center gap-2 p-2 text-muted-foreground ${className}`}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm group-data-[collapsible=icon]:hidden">No organizations found</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 ${className}`}>
      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select value={selectedOrgId || activeOrgId} onValueChange={handleOrganizationChange}>
        <SelectTrigger className="flex-1 min-w-0 h-8 border-0 shadow-none p-1 hover:bg-accent/50 focus:bg-accent group-data-[collapsible=icon]:hidden">
          <SelectValue>
            {selectedOrg ? (
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate">
                  {selectedOrg.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  @{selectedOrg.slug}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Select organization</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">@{org.slug}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}