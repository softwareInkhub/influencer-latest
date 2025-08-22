import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Package, Truck, MapPin, Calendar, Clock, Upload, Mail, Phone, Eye, Copy, ExternalLink, MessageCircle, CheckCircle } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import VideoUploadDialog from "./video-upload-dialog";
import type { Order } from "../../shared/schema";

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusClasses = (status?: string) => {
  const normalized = (status || "").toString().toLowerCase();
  if (normalized === "created") return "bg-blue-100 text-blue-800 border-blue-200";
  if (normalized === "intransit") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (normalized === "delivered") return "bg-green-100 text-green-800 border-green-200";
  if (normalized === "completed") return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getContentStatusClasses = (status?: string) => {
  const normalized = (status || "").toString().toLowerCase();
  if (normalized === "pendingrawvideo") return "bg-blue-100 text-blue-800 border-blue-200";
  if (normalized === "editing") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (normalized === "inreview") return "bg-orange-100 text-orange-800 border-orange-200";
  if (normalized === "readytoschedule") return "bg-purple-100 text-purple-800 border-purple-200";
  if (normalized === "completed") return "bg-green-100 text-green-800 border-green-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export default function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { influencers, content } = useApp();

  const authUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
  }, []);
  const isAdmin = (authUser?.roleName || authUser?.role || '').toString().toUpperCase() === 'ADMIN';

  if (!order) return null;

  const influencer = influencers.find(inf => inf.id === order.influencerId);
  const orderContent = content.filter(c => c.orderId === order.id);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      // Here we would update the order status
      console.log('Updating order status:', order.id, newStatus);
      // await updateOrder(order.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDDMMYYYY = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTimelineStep = (status: string) => {
    const steps = ['Created', 'InTransit', 'Delivered'];
    const currentIndex = steps.findIndex(step => step.toLowerCase() === status.toLowerCase());
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-lg" hideCloseButton>
        <DialogHeader className="relative pb-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <Package className="w-5 h-5 text-gray-600" />
                <DialogTitle className="text-lg text-gray-900">
                  Order #{order.shopifyOrderId}
                </DialogTitle>
                <Badge className={`${getStatusClasses(order.status)} border`}>
                  {order.status}
                </Badge>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Created on {formatDDMMYYYY(order.createdAt)} • Shopify ID {order.shopifyOrderId}
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => window.open('https://shopify.com', '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open in Shopify
                </Button>
              </div>
            </div>
            <span 
              className="text-gray-500 text-lg cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              ×
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Influencer Section */}
          {influencer && (
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Influencer</h4>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">
                      HK
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Himanshu Kumar</h3>
                    <Badge className="mt-2 bg-gray-100 text-gray-800 border-gray-200">
                      OrderCreated
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">himashu@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">+918002499033</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      piska more
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Section */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Products</h4>
              <div className="space-y-3">
                {order.products && order.products.length > 0 ? (
                  order.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                        <p className="text-xs text-gray-500">₹{(product.price * product.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No products added yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipment Section */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Shipment</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Carrier</span>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                    {order.trackingInfo?.status || 'Processing'}
                  </Badge>
                </div>
                
                {order.trackingInfo?.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Tracking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{order.trackingInfo.trackingNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.trackingInfo.trackingNumber)}
                        className="w-6 h-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">ETA: {formatDDMMYYYY(order.trackingInfo?.estimatedDelivery || new Date())}</span>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  {['Created', 'In Transit', 'Delivered'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        index < getTimelineStep(order.status)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index < getTimelineStep(order.status) ? <CheckCircle className="w-3 h-3" /> : index + 1}
                      </div>
                      {index < 2 && (
                        <div className={`w-8 h-0.5 mx-1 ${
                          index < getTimelineStep(order.status) - 1 ? 'bg-blue-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Status Section */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Content Status</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Pending Raw Video', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { label: 'Editing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { label: 'In Review', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { label: 'Ready to Schedule', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                  { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' }
                ].map(({ label, color }) => (
                  <Badge
                    key={label}
                    className={`${color} border text-xs font-medium`}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Information Section */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatDDMMYYYY(order.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">{formatDDMMYYYY(order.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID</span>
                  <span className="text-xs font-mono text-gray-500">{order.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {isAdmin && (
              <Button className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Notify via WhatsApp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Video Upload Dialog */}
      <VideoUploadDialog 
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        order={order}
      />
    </Dialog>
  );
}