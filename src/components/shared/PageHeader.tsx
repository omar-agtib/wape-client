import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  searchValue?: string;
  onSearch?: (val: string) => void;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  onAdd,
  addLabel,
  searchValue,
  onSearch,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchValue || ""}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 w-48 bg-card"
            />
          </div>
        )}
        {children}
        {onAdd && (
          <Button onClick={onAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel || "Add New"}
          </Button>
        )}
      </div>
    </div>
  );
}
