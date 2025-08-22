import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Plus, MessageSquare, Edit, Trash2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import type { MessageTemplate } from "../../shared/schema";

export default function MessagesTab() {
  const { messageTemplates } = useApp();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Onboarding": return "bg-blue-100 text-blue-800";
      case "Order Updates": return "bg-yellow-100 text-yellow-800";
      case "Content": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Communication Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Communication</h2>
          <p className="text-sm text-gray-600 mt-1">Manage message templates and WhatsApp integration</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="w-4 h-4 mr-2 text-white" />
          New Template
        </Button>
      </div>

      {/* WhatsApp Integration Status */}
      <Card className="bg-white border-0 shadow-md rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">WhatsApp Integration</p>
                <p className="text-xs text-gray-500">Connected via Whapi • 247 active chats</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </CardContent>
      </Card>

            {/* Message Templates Section */}
      <div>
        <Card className="bg-white border-0 shadow-md rounded-xl">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Message Templates</h3>
            </div>
            <div className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No message templates</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create templates to streamline your communication
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2 text-white" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages Section */}
      <div>
        <Card className="bg-white border-0 shadow-md rounded-xl">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Recent Messages</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">SJ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">10m ago</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">Thanks for the update! I'll check out the content that...</p>
                </div>
              </div>

              <div className="p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">MC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Michael Chen</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">1h ago</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">The new campaign looks promising. Let's discuss the...</p>
                </div>
              </div>

              <div className="p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">ED</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Emma Davis</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">3h ago</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">I've uploaded the latest batch of content for review...</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
