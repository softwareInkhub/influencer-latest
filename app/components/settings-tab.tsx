import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Plus, MessageSquare, ShoppingBag, Users, Twitter } from "lucide-react";

export default function SettingsTab() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Settings</h2>

      {/* Company Profile */}
      <Card className="bg-white border-0 shadow-md rounded-xl">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input 
                  id="company-name"
                  defaultValue="Demo Company" 
                  className="mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                  Contact Email
                </Label>
                <Input 
                  id="contact-email"
                  type="email" 
                  defaultValue="contact@demo.com" 
                  className="mt-1 h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input 
                id="phone"
                type="tel" 
                defaultValue="+1 (555) 123-4567" 
                className="mt-1 h-10 text-sm"
              />
            </div>
          </div>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-white border-0 shadow-md rounded-xl">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Integrations</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Shopify</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-3 text-sm">
                Disconnect
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">247 active chats</p>
                </div>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-3 text-sm">
                Disconnect
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Twitter API</p>
                  <p className="text-xs text-gray-500">Not connected</p>
                </div>
              </div>
              <Button variant="outline" className="h-8 px-3 text-sm">
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="bg-white border-0 shadow-md rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="w-4 h-4 mr-2 text-white" />
              Invite
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm text-white font-medium">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
              <Button variant="outline" className="h-8 px-3 text-sm">
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-sm text-white font-medium">JS</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Jane Smith</p>
                  <p className="text-xs text-gray-500">Editor</p>
                </div>
              </div>
              <Button variant="outline" className="h-8 px-3 text-sm">
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
