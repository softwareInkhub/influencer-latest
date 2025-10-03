import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Plus, Package, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import OrderDetailDialog from "./order-detail-dialog";
import CreateOrderDialog from "./create-order-dialog";
import type { Order } from "../../shared/schema";

const statusColors = {
  Created: "bg-blue-100 text-blue-800",
  InTransit: "bg-yellow-100 text-yellow-800",
  Delivered: "bg-green-100 text-green-800",
  Completed: "bg-purple-100 text-purple-800"
};

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const { orders } = useApp();

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const created = orders.filter(o => o.status === "Created").length;
  const inTransit = orders.filter(o => o.status === "InTransit").length;
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const completed = orders.filter(o => o.status === "Completed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Track product fulfillment</p>
        </div>
        <Button 
          onClick={() => setShowCreateOrderDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2 text-white" />
          Create Order
        </Button>
      </div>

       {/* Order Statistics Cards */}
       <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-blue-600">{created}</div>
             <div className="text-xs text-gray-600">Created</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-yellow-600">{inTransit}</div>
             <div className="text-xs text-gray-600">In Transit</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-green-600">{delivered}</div>
             <div className="text-xs text-gray-600">Delivered</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-purple-600">{completed}</div>
             <div className="text-xs text-gray-600">Completed</div>
           </CardContent>
         </Card>
       </div>

      {/* Orders List */}
      <div className="space-y-3">
        {(!orders || orders.length === 0) ? (
          <Card className="bg-white border-0 shadow-md rounded-xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create your first order to get started
              </p>
              <Button 
                onClick={() => setShowCreateOrderDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                Create Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card 
              key={order.id} 
              className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer rounded-xl"
              onClick={() => handleOrderClick(order)}
            >
                             <CardContent className="p-2">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                       <Package className="w-5 h-5 text-white" />
                     </div>
                     <div className="min-w-0">
                       <h3 className="text-sm font-semibold text-gray-900">#{order.shopifyOrderId}</h3>
                       <p className="text-xs text-gray-600">Influencer #{order.influencerId.slice(-4)}</p>
                     </div>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${
                       statusColors[order.status as keyof typeof statusColors]
                     }`}>
                       {order.status}
                     </Badge>
                     <ChevronRight className="w-4 h-4 text-gray-400" />
                   </div>
                 </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog 
        order={selectedOrder}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={showCreateOrderDialog}
        onOpenChange={setShowCreateOrderDialog}
      />
    </div>
  );
}
