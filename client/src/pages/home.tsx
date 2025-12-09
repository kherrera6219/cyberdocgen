import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeTutorial } from "@/components/onboarding/WelcomeTutorial";
import { QuickStartChecklist } from "@/components/onboarding/QuickStartChecklist";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { 
  User, 
  LogOut, 
  Building, 
  FileText, 
  BarChart3,
  Brain,
  Wand2,
  MessageSquare,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Target,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

export function Home() {
  const { user } = useAuth() as { user: UserType | undefined };
  const [showTutorial, setShowTutorial] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    try {
      const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('Error accessing localStorage for tutorial state:', error);
      setShowTutorial(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const targetScore = 72;
    const duration = 1500;
    const steps = 60;
    const increment = targetScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      if (!isMounted) {
        clearInterval(timer);
        return;
      }
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleTutorialComplete = () => {
    try {
      localStorage.setItem('hasSeenTutorial', 'true');
    } catch (error) {
      console.error('Error saving tutorial state to localStorage:', error);
    }
    setShowTutorial(false);
  };

  const [aiErrorKey, setAiErrorKey] = useState(0);
  
  const AIFeaturesFallback = () => (
    <div className="p-6 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
        <AlertCircle className="h-5 w-5" />
        <span>Unable to load AI features</span>
      </div>
      <Button 
        variant="outline" 
        onClick={() => setAiErrorKey(prev => prev + 1)}
        data-testid="button-reload-features"
      >
        Try Again
      </Button>
    </div>
  );

  const aiFeatures = [
    {
      title: "AI Document Generator",
      description: "Generate complete compliance documents using GPT-4 and Claude AI models",
      icon: Wand2,
      href: "/ai-doc-generator",
      color: "from-blue-500 to-purple-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      badge: "Most Popular"
    },
    {
      title: "AI Compliance Assistant",
      description: "Chat with AI to get instant answers about compliance requirements",
      icon: MessageSquare,
      href: "/ai-assistant",
      color: "from-green-500 to-teal-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      badge: null
    },
    {
      title: "Risk Assessment",
      description: "AI-powered risk analysis and mitigation recommendations",
      icon: AlertTriangle,
      href: "/risk-assessment",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      badge: null
    },
    {
      title: "Gap Analysis",
      description: "Identify compliance gaps with intelligent control mapping",
      icon: Search,
      href: "/gap-analysis",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      badge: "New"
    }
  ];

  const quickActions = [
    {
      title: "Dashboard",
      description: "View compliance analytics and progress",
      icon: BarChart3,
      href: "/dashboard",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Organizations",
      description: "Manage your organizations",
      icon: Building,
      href: "/organizations",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Documents",
      description: "Access your compliance documents",
      icon: FileText,
      href: "/documents",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "User Profile",
      description: "Manage your account settings",
      icon: User,
      href: "/user-profile",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                Manage your compliance documentation with AI-powered automation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/logout'}
                className="flex items-center gap-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-8 border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">AI Compliance Score</h2>
                  <p className="text-blue-100 text-sm sm:text-base">Your overall compliance health powered by AI analysis</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-bold">{animatedScore}</div>
                    <div className="text-blue-200 text-sm">out of 100</div>
                  </div>
                  <div className="h-16 w-px bg-white/20" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-300" />
                      <span className="text-sm text-green-200">+5% this month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-200" />
                      <span className="text-sm text-blue-200">Medium Risk</span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="bg-white text-blue-600 w-full sm:w-auto"
                  onClick={() => window.location.href = '/dashboard'}
                  data-testid="button-view-dashboard"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-100">Progress to next level</span>
                <span className="text-white font-medium">{animatedScore}%</span>
              </div>
              <Progress value={animatedScore} className="h-2 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        <ErrorBoundary key={aiErrorKey} fallback={<AIFeaturesFallback />}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Features</h2>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Zap className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {aiFeatures.map((feature) => (
                <Card 
                  key={feature.title}
                  className="group cursor-pointer border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md transition-all duration-300"
                  onClick={() => window.location.href = feature.href}
                  data-testid={`card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 ${feature.bgColor} rounded-xl transition-transform duration-300 group-hover:scale-110`}>
                        <feature.icon className={`h-6 w-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} style={{ stroke: 'url(#gradient)' }} />
                        <svg width="0" height="0">
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <feature.icon className={`h-6 w-6 text-blue-600 dark:text-blue-400`} />
                      </div>
                      {feature.badge && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{feature.description}</p>
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ErrorBoundary>

        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <Target className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action) => (
              <Card 
                key={action.title}
                className="group cursor-pointer border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm transition-all duration-300"
                onClick={() => window.location.href = action.href}
                data-testid={`card-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                  <div className={`p-2 ${action.bgColor} rounded-lg transition-colors`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <QuickStartChecklist className="mb-8" />

        {user && (
          <Card className="border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-lg text-gray-900 dark:text-white" data-testid="text-user-name">
                    {user.firstName || user.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-lg text-gray-900 dark:text-white" data-testid="text-user-email">{user?.email ?? 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                  <p className="text-lg text-gray-900 dark:text-white capitalize" data-testid="text-user-role">{user?.role ?? 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                      data-testid="status-user-active"
                    >
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <WelcomeTutorial 
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={handleTutorialComplete}
        />
      </div>
    </div>
  );
}
