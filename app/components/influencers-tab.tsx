import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Plus, MoreVertical, Instagram, Youtube, Users, Eye, ShoppingCart, Edit, Trash2, MessageCircle, UserCheck } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import AddInfluencerDialog from "./add-influencer-dialog";
import InfluencerDetailDialog from "./influencer-detail-dialog";
import CreateOrderDialog from "./create-order-dialog";
import type { Influencer } from "../../shared/schema";

const statusColors = {
  PendingApproval: "bg-amber-100 text-amber-800 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  OrderCreated: "bg-purple-100 text-purple-800 border-purple-200",
  PendingVideoUpload: "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function InfluencersTab() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null);
  const [deletingInfluencer, setDeletingInfluencer] = useState<string | null>(null);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [selectedInfluencerForOrder, setSelectedInfluencerForOrder] = useState<Influencer | null>(null);
  const { influencers, orders, updateInfluencer, addOrder, deleteInfluencer } = useApp();
  const safeInfluencers = Array.isArray(influencers) ? influencers : [];

  // Log current influencers data
  console.log('=== INFLUENCERS TAB DATA ===');
  console.log('Current influencers:', safeInfluencers);
  console.log('Influencers count:', safeInfluencers.length);
  console.log('Active filter:', activeFilter);
  console.log('Filtered influencers:', safeInfluencers.filter((influencer) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return influencer.status === "PendingApproval";
    if (activeFilter === "approved") return influencer.status === "Approved";
    if (activeFilter === "active") return influencer.status === "OrderCreated" || influencer.status === "PendingVideoUpload";
    return true;
  }));

  const handleStatusUpdate = async (id: string, status: string) => {
    setIsUpdating(true);
    try {
      await updateInfluencer(id, { status });
    } catch (error) {
      console.error('Failed to update influencer:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInfluencerClick = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setShowDetailDialog(true);
  };

  const handleCreateOrder = (influencer: Influencer) => {
    console.log('Opening create order dialog for influencer:', influencer.name, influencer.id);
    setSelectedInfluencerForOrder(influencer);
    setShowCreateOrderDialog(true);
  };

  const handleDeleteInfluencer = async (influencer: Influencer) => {
    if (!confirm(`Are you sure you want to delete ${influencer.name}? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingInfluencer(influencer.id);
    try {
      await deleteInfluencer(influencer.id);
    } catch (error) {
      console.error('Failed to delete influencer:', error);
    } finally {
      setDeletingInfluencer(null);
    }
  };

  const handleEditInfluencer = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setShowDetailDialog(true);
  };

  const handleApproveInfluencer = async (influencer: Influencer) => {
    await handleStatusUpdate(influencer.id, "Approved");
  };

  const hasOrder = (influencerId: string) => {
    return orders.some(order => order.influencerId === influencerId);
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '??';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };



  const pendingCount = safeInfluencers.filter(i => i.status === "PendingApproval").length;
  const approvedCount = safeInfluencers.filter(i => i.status === "Approved").length;
  const activeCount = safeInfluencers.filter(i => i.status === "OrderCreated" || i.status === "PendingVideoUpload").length;
  const archivedCount = safeInfluencers.filter(i => i.status === "Rejected").length;

  const filteredInfluencers = safeInfluencers.filter((influencer) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return influencer.status === "PendingApproval";
    if (activeFilter === "approved") return influencer.status === "Approved";
    if (activeFilter === "active") return influencer.status === "OrderCreated" || influencer.status === "PendingVideoUpload";
    if (activeFilter === "archived") return influencer.status === "Rejected";
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Influencers</h2>
          <p className="text-sm text-gray-600">Manage your influencer network</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2 text-white" />
          Add New
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Badge 
          className={`whitespace-nowrap cursor-pointer transition-all ${
            activeFilter === "all" 
              ? "bg-blue-100 text-blue-800 border-blue-200" 
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50"
          }`}
          onClick={() => setActiveFilter("all")}
        >
          All ({safeInfluencers.length})
        </Badge>
        <Badge 
          className={`whitespace-nowrap cursor-pointer transition-all ${
            activeFilter === "pending" 
              ? "bg-amber-100 text-amber-800 border-amber-200" 
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-amber-50"
          }`}
          onClick={() => setActiveFilter("pending")}
        >
          Pending ({pendingCount})
        </Badge>
        <Badge 
          className={`whitespace-nowrap cursor-pointer transition-all ${
            activeFilter === "approved" 
              ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-emerald-50"
          }`}
          onClick={() => setActiveFilter("approved")}
        >
          Approved ({approvedCount})
        </Badge>
        <Badge 
          className={`whitespace-nowrap cursor-pointer transition-all ${
            activeFilter === "active" 
              ? "bg-purple-100 text-purple-800 border-purple-200" 
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-purple-50"
          }`}
          onClick={() => setActiveFilter("active")}
        >
          Active ({activeCount})
        </Badge>
        <Badge 
          className={`whitespace-nowrap cursor-pointer transition-all ${
            activeFilter === "archived" 
              ? "bg-gray-200 text-gray-800 border-gray-300" 
              : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
          }`}
          onClick={() => setActiveFilter("archived")}
        >
          Archived ({archivedCount})
        </Badge>
      </div>

      {/* Influencer Cards */}
      <div className="space-y-2">
        {filteredInfluencers.map((influencer) => (
          <Card 
            key={influencer.id} 
            className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleInfluencerClick(influencer)}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">
                    {getInitials(influencer.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{influencer.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${statusColors[influencer.status as keyof typeof statusColors]} border`}>
                        {influencer.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditInfluencer(influencer);
                            }}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-gray-900 cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4 text-gray-500" />
                            Edit Profile
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle message template action
                              console.log('Message template for:', influencer.name);
                            }}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-gray-900 cursor-pointer"
                          >
                            <MessageCircle className="mr-2 h-4 w-4 text-gray-500" />
                            Message Template
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-gray-200" />
                          
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInfluencer(influencer);
                            }}
                            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            disabled={deletingInfluencer === influencer.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            {deletingInfluencer === influencer.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Social Media Stats - Compact */}
                  <div className="flex items-center space-x-3 mt-1">
                    {influencer.socialMedia?.instagram && (
                      <div className="flex items-center space-x-1">
                        <Instagram className="w-3 h-3 text-pink-500" />
                        <span className="text-xs text-gray-600">
                          {formatNumber(influencer.socialMedia.instagram.followers)}
                        </span>
                      </div>
                    )}
                    {influencer.socialMedia?.youtube && (
                      <div className="flex items-center space-x-1">
                        <Youtube className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-gray-600">
                          {formatNumber(influencer.socialMedia.youtube.subscribers)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Pending Approval - Compact */}
                  {influencer.status === "PendingApproval" && (
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(influencer.id, "Approved");
                        }}
                        disabled={isUpdating}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 h-7 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(influencer.id, "Rejected");
                        }}
                        disabled={isUpdating}
                      >
                        Archive
                      </Button>
                    </div>
                  )}

                  {/* Create Order Button for Approved Influencers without orders */}
                  {influencer.status === "Approved" && !hasOrder(influencer.id) && (
                    <div className="flex mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateOrder(influencer);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>Create Order</span>
                        </div>
                      </Button>
                    </div>
                  )}

                  {/* Create Order Button for OrderCreated Influencers (can create additional orders) */}
                  {influencer.status === "OrderCreated" && (
                    <div className="flex mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateOrder(influencer);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>Create Order</span>
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!filteredInfluencers || filteredInfluencers.length === 0) && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            {activeFilter === "all" ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No influencers yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Start building your influencer network by adding your first creator
                </p>
                                 <Button 
                   onClick={() => setShowAddDialog(true)}
                   className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   <Plus className="w-4 h-4 mr-2 text-white" />
                   Add Influencer
                 </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No {activeFilter} influencers</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  No influencers match the current filter. Try a different category or add new influencers.
                </p>
                <Button 
                  onClick={() => setActiveFilter("all")}
                  variant="outline"
                  className="mr-2"
                >
                  View All
                </Button>
                                 <Button 
                   onClick={() => setShowAddDialog(true)}
                   className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   <Plus className="w-4 h-4 mr-2 text-white" />
                   Add Influencer
                 </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <AddInfluencerDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      <InfluencerDetailDialog
        influencer={selectedInfluencer}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <CreateOrderDialog
        open={showCreateOrderDialog}
        onOpenChange={(open) => {
          setShowCreateOrderDialog(open);
          if (!open) {
            setSelectedInfluencerForOrder(null);
          }
        }}
        selectedInfluencer={selectedInfluencerForOrder}
      />
    </div>
  );
}
