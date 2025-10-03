import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { VideoIcon, Plus, Check, X, ChevronRight, Image, FileText, Upload, Play } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import ContentDetailDialog from "./content-detail-dialog";
import VideoUploadDialog from "./video-upload-dialog";
import type { Content } from "../../shared/schema";

const statusColors = {
  PendingUpload: "bg-gray-100 text-gray-800",
  PendingEditing: "bg-yellow-100 text-yellow-800",
  PendingReview: "bg-orange-100 text-orange-800",
  Approved: "bg-green-100 text-green-800",
  Reassigned: "bg-red-100 text-red-800",
  Scheduled: "bg-blue-100 text-blue-800"
};

export default function ContentTab() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { content, updateContent, orders, influencers, addContent } = useApp();

  const handleContentClick = (contentItem: Content) => {
    setSelectedContent(contentItem);
    setShowDetailDialog(true);
  };

  const handleApprove = async (id: string) => {
    setIsUpdating(true);
    try {
      await updateContent(id, { status: "Approved" });
    } catch (error) {
      console.error('Failed to update content:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsUpdating(true);
    try {
      await updateContent(id, { status: "Reassigned" });
    } catch (error) {
      console.error('Failed to update content:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const pending = content.filter(c => c.status === "PendingReview").length;
  const editing = content.filter(c => c.status === "PendingEditing").length;
  const approved = content.filter(c => c.status === "Approved").length;
  const uploaded = content.filter(c => c.status === "PendingUpload").length;
  
  const filteredContent = content.filter((contentItem) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return contentItem.status === "PendingReview";
    if (activeFilter === "editing") return contentItem.status === "PendingEditing";
    if (activeFilter === "approved") return contentItem.status === "Approved";
    if (activeFilter === "uploaded") return contentItem.status === "PendingUpload";
    return true;
  });

  const getContentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <VideoIcon className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Create mock content for orders that need content upload
  const createMockContent = async () => {
    const ordersNeedingContent = orders.filter(order => 
      order.status === "Created" && 
      !content.some(c => c.orderId === order.id)
    );

    for (const order of ordersNeedingContent) {
      await addContent({
        type: "Video",
        s3Link: `https://demo-bucket.s3.amazonaws.com/content-${order.id}.mp4`,
        status: "PendingUpload",
        influencerId: order.influencerId,
        orderId: order.id,
        companyId: order.companyId,
        editedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Content</h2>
          <p className="text-sm text-gray-600 mt-1">Manage influencer content</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              // Find an order that needs content upload
              const orderNeedingContent = orders.find(order => 
                order.status === "Created" && 
                !content.some(c => c.orderId === order.id)
              );
              if (orderNeedingContent) {
                setSelectedOrder(orderNeedingContent);
                setShowUploadDialog(true);
              } else {
                // If no orders need content, show upload dialog without order
                setSelectedOrder(null);
                setShowUploadDialog(true);
              }
            }}
          >
            <Upload className="w-4 h-4 mr-2 text-purple-600" />
            Upload
          </Button>
                     <Button 
             className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
             onClick={createMockContent}
           >
             <Plus className="w-4 h-4 mr-2 text-white" />
             Sync
           </Button>
        </div>
      </div>

             {/* Filter Bar */}
       <div className="grid grid-cols-2 md:inline-flex md:space-x-1 gap-1 md:gap-0">
         <button
           className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
             activeFilter === "all" 
               ? "bg-blue-100 text-blue-800 border border-blue-200" 
               : "bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900"
           }`}
           onClick={() => setActiveFilter("all")}
         >
           All ({content.length})
         </button>
         <button
           className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
             activeFilter === "uploaded" 
               ? "bg-blue-100 text-blue-800 border border-blue-200" 
               : "bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900"
           }`}
           onClick={() => setActiveFilter("uploaded")}
         >
           Uploaded ({uploaded})
         </button>
         <button
           className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
             activeFilter === "pending" 
               ? "bg-blue-100 text-blue-800 border border-blue-200" 
               : "bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900"
           }`}
           onClick={() => setActiveFilter("pending")}
         >
           Review ({pending})
         </button>
         <button
           className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
             activeFilter === "approved" 
               ? "bg-blue-100 text-blue-800 border border-blue-200" 
               : "bg-gray-100 text-gray-600 border border-gray-200 hover:text-gray-900"
           }`}
           onClick={() => setActiveFilter("approved")}
         >
           Approved ({approved})
         </button>
       </div>

             {/* Content Status Overview */}
       <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-gray-900">{uploaded}</div>
             <div className="text-xs text-gray-600">Uploaded</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-orange-600">{pending}</div>
             <div className="text-xs text-gray-600">Pending Review</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-purple-600">{editing}</div>
             <div className="text-xs text-gray-600">In Editing</div>
           </CardContent>
         </Card>
         <Card className="bg-white border-0 shadow-md rounded-xl">
           <CardContent className="p-3 text-center">
             <div className="text-2xl font-bold text-green-600">{approved}</div>
             <div className="text-xs text-gray-600">Approved</div>
           </CardContent>
         </Card>
       </div>

      {/* Content Items */}
      <div className="space-y-3">
        {(!filteredContent || filteredContent.length === 0) ? (
          <Card className="bg-white border-0 shadow-md rounded-xl">
            <CardContent className="p-12 text-center">
              <VideoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No content yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Content will appear here as influencers upload videos and images
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((contentItem) => (
              <Card 
                key={contentItem.id}
                className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleContentClick(contentItem)}
              >
                <CardContent className="p-0">
                  {/* Media Preview */}
                  <div className="relative">
                    {contentItem.type.toLowerCase() === 'video' ? (
                      <div className="aspect-video bg-gray-900 relative overflow-hidden">
                        <video 
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMUYyOTM3Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIyNCIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTUyIDgyTDE3MiA5MEwxNTIgOThWODJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
                        >
                          <source src={contentItem.s3Link} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-gray-800 ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-purple-600 text-white text-xs">
                            <VideoIcon className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        </div>
                      </div>
                    ) : contentItem.type.toLowerCase() === 'image' ? (
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img 
                          src={contentItem.s3Link}
                          alt={`${contentItem.type} content`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iNjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgcng9IjQiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iODAiIHI9IjYiIGZpbGw9IiM5N0EzQjMiLz4KPHBhdGggZD0iTTEzMCAxMDBMMTQ1IDg1TDE2NSAxMDBIMTMwWiIgZmlsbD0iIzk3QTNCMyIvPgo8dGV4dCB4PSIxNjAiIHk9IjE0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY3NzQ4RiIgZm9udC1zaXplPSIxMiI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=";
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-600 text-white text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            Image
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          {getContentIcon(contentItem.type)}
                          <p className="text-sm text-gray-600 mt-2">{contentItem.type}</p>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-gray-600 text-white text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            {contentItem.type}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={`text-xs ${statusColors[contentItem.status as keyof typeof statusColors]}`}>
                        {contentItem.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {contentItem.type} #{contentItem.id.slice(-6)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Influencer #{contentItem.influencerId.slice(-4)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {contentItem.createdAt ? new Date(contentItem.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Content Detail Dialog */}
      <ContentDetailDialog 
        content={selectedContent}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Video Upload Dialog */}
      <VideoUploadDialog 
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        order={selectedOrder}
      />
    </div>
  );
}
