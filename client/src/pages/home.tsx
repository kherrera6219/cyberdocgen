import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeTutorial } from "@/components/onboarding/WelcomeTutorial";
import { QuickStartChecklist } from "@/components/onboarding/QuickStartChecklist";
import { User, LogOut, Settings, Building, FileText, BarChart3 } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export function Home() {
  const { user } = useAuth() as { user: UserType | undefined };
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user is new (show tutorial on first visit)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Manage your compliance documentation and generate new frameworks
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/logout'}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105"
            onClick={() => window.location.href = '/dashboard'}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Dashboard</CardTitle>
                <CardDescription>View compliance analytics and progress</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105"
            onClick={() => window.location.href = '/organizations'}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Organizations</CardTitle>
                <CardDescription>Manage your organizations</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105"
            onClick={() => window.location.href = '/documents'}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">Documents</CardTitle>
                <CardDescription>Access your compliance documents</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105"
            onClick={() => window.location.href = '/user-profile'}
          >
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <CardTitle className="text-lg">User Profile</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start Checklist */}
        <QuickStartChecklist className="mb-8" />

        {/* User Profile Card */}
        {user && (
          <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {user.firstName || user.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-lg text-gray-900 dark:text-white">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                  <p className="text-lg text-gray-900 dark:text-white capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Tutorial */}
        <WelcomeTutorial 
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={handleTutorialComplete}
        />
      </div>
    </div>
  );
}