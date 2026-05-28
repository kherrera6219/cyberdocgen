import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export interface StorageStatsData {
  totalFiles: number;
  byFolder: {
    documents: number;
    profiles: number;
    backups: number;
    files: number;
    auditLogs: number;
    other: number;
  };
  lastUpdated: string;
}

interface StorageStatsViewProps {
  stats?: StorageStatsData;
  isLoading: boolean;
  detailed?: boolean; // If true, shows more details (charts/progress)
}

export function StorageStatsView({ stats, isLoading, detailed = false }: StorageStatsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-muted h-4 rounded w-1/3"></div>
        <div className="animate-pulse bg-muted h-4 rounded w-2/3"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4" data-testid="storage-unconfigured-container">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shadow-sm">
          <AlertCircle className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Storage Not Configured</h3>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            The object storage service is currently unavailable or unconfigured in your local settings.
          </p>
        </div>
        <Button 
          asChild
          size="sm" 
          variant="outline" 
          className="w-full text-xs font-semibold hover:bg-amber-500/10 transition-colors h-9"
        >
          <Link href="/local-settings">Configure Storage</Link>
        </Button>
      </div>
    );
  }

  if (detailed) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.byFolder.documents}
            </div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.byFolder.profiles}
            </div>
            <div className="text-sm text-muted-foreground">Profiles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.byFolder.backups}
            </div>
            <div className="text-sm text-muted-foreground">Backups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.byFolder.files}
            </div>
            <div className="text-sm text-muted-foreground">Files</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Storage Utilization</span>
            <span>{stats.totalFiles} files</span>
          </div>
          <Progress value={(stats.totalFiles / 1000) * 100} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      </div>
    );
  }

  // Simple view
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm">Total Files:</span>
        <Badge variant="secondary">{stats.totalFiles}</Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Documents:</span>
          <span>{stats.byFolder.documents}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Profiles:</span>
          <span>{stats.byFolder.profiles}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Backups:</span>
          <span>{stats.byFolder.backups}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Files:</span>
          <span>{stats.byFolder.files}</span>
        </div>
      </div>
    </div>
  );
}
