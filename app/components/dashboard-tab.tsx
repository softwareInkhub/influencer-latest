import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Users, CheckCircle, VideoIcon, Plus, TrendingUp, Activity } from "lucide-react";
import AddInfluencerDialog from "./add-influencer-dialog";
import { useApp } from "../contexts/AppContext";

interface DashboardTabProps {
  onTabChange?: (tab: string) => void;
}

export default function DashboardTab({ onTabChange }: DashboardTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { stats } = useApp();

  const handleCardClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Influencer
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Influencers */}
        <Card 
          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl"
          onClick={() => handleCardClick('influencers')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.totalInfluencers}</p>
                <p className="text-xs text-gray-600 font-medium">Total Influencers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card 
          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl"
          onClick={() => handleCardClick('orders')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.activeOrders}</p>
                <p className="text-xs text-gray-600 font-medium">Active Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Content */}
        <Card 
          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl"
          onClick={() => handleCardClick('content')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <VideoIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.pendingContent}</p>
                <p className="text-xs text-gray-600 font-medium">Pending Content</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card 
          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl"
          onClick={() => handleCardClick('dashboard')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.completionRate}</p>
                <p className="text-xs text-gray-600 font-medium">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="bg-white border-0 shadow-md rounded-xl">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sarah uploaded content for Nike Campaign</p>
              <p className="text-xs text-gray-500">2 min ago</p>
            </div>
          </div>
          <div className="p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Emma Davis submitted for approval</p>
              <p className="text-xs text-gray-500">1 hr ago</p>
            </div>
          </div>
          <div className="p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Order #1234 delivered to Michael</p>
              <p className="text-xs text-gray-500">3 hr ago</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Workflow Progress Section */}
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-0 shadow-md rounded-xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Workflow Progress</h3>
            <p className="text-xs text-gray-600">Track stages & bottlenecks</p>
          </div>
        </CardContent>
      </Card>

      <AddInfluencerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
}
