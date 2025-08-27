import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Zap, Users, Package, VideoIcon, MessageSquare, Settings, BarChart3, LogOut } from "lucide-react";
import DashboardTab from "../components/dashboard-tab";
import InfluencersTab from "../components/influencers-tab";
import OrdersTab from "../components/orders-tab";
import ContentTab from "../components/content-tab";
import MessagesTab from "../components/messages-tab";
import SettingsTab from "../components/settings-tab";

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Get the stored tab from localStorage, default to "dashboard"
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeTab') || "dashboard";
    }
    return "dashboard";
  });

  // Save active tab to localStorage whenever it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTab', value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">InfluenceHub</h1>
                <p className="text-xs text-gray-500">Influencer Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white">JD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pb-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-6 h-12 w-full bg-gray-100/50 rounded-xl p-1">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="influencers"
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Influencers</span>
              </TabsTrigger>

              <TabsTrigger 
                value="orders"
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Package className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Orders</span>
              </TabsTrigger>

              <TabsTrigger 
                value="content"
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <VideoIcon className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Content</span>
              </TabsTrigger>

              <TabsTrigger 
                value="messages"
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Messages</span>
              </TabsTrigger>

              <TabsTrigger 
                value="settings"
                className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab onTabChange={setActiveTab} />
          </TabsContent>
          
          <TabsContent value="influencers" className="mt-0">
            <InfluencersTab />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-0">
            <OrdersTab />
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <ContentTab />
          </TabsContent>
          
          <TabsContent value="messages" className="mt-0">
            <MessagesTab />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
