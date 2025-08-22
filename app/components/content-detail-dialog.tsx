import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { VideoIcon, FileText, Image, Calendar, User, CheckCircle, X, Eye, Play, Pause, Volume2, VolumeX, Maximize2, ExternalLink } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import type { Content } from "../../shared/schema";

interface ContentDetailDialogProps {
  content: Content | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  PendingUpload: "bg-gray-100 text-gray-800 border-gray-200",
  PendingEditing: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PendingReview: "bg-orange-100 text-orange-800 border-orange-200",
  Approved: "bg-green-100 text-green-800 border-green-200",
  Reassigned: "bg-red-100 text-red-800 border-red-200",
  Scheduled: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function ContentDetailDialog({ content, open, onOpenChange }: ContentDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { influencers, orders, updateContent } = useApp();

  if (!content) return null;

  const influencer = influencers.find(inf => inf.id === content.influencerId);
  const order = orders.find(ord => ord.id === content.orderId);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateContent(content.id, { status: newStatus });
      console.log('Content status updated:', content.id, newStatus);
    } catch (error) {
      console.error('Failed to update content:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getContentIcon = () => {
    switch (content.type.toLowerCase()) {
      case 'video':
        return <VideoIcon className="w-6 h-6 text-purple-600" />;
      case 'image':
        return <Image className="w-6 h-6 text-blue-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isVideo = content.type.toLowerCase() === 'video';
  const isImage = content.type.toLowerCase() === 'image';

  const renderMediaPreview = () => {
    if (isVideo) {
      return (
        <div className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}>
          <video 
            className="w-full h-full object-contain"
            controls={false}
            muted={isMuted}
            loop
            playsInline
            poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMUYyOTM3Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIyNCIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTUyIDgyTDE3MiA5MEwxNTIgOThWODJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
          >
            <source src={content.s3Link} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-4">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={handleMuteToggle}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={handleFullscreen}
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Touch Controls */}
          <div className="absolute bottom-4 left-4 right-4 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white bg-black bg-opacity-50 hover:bg-opacity-70"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white bg-black bg-opacity-50 hover:bg-opacity-70"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white bg-black bg-opacity-50 hover:bg-opacity-70"
                onClick={handleFullscreen}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Fullscreen Close Button */}
          {isFullscreen && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 z-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      );
    }

    if (isImage) {
      return (
        <div className={`relative rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}>
          <img 
            src={content.s3Link}
            alt={`${content.type} content`}
            className={`${isFullscreen ? 'max-w-full max-h-full object-contain' : 'w-full h-auto max-h-96 object-cover'} cursor-pointer`}
            onClick={handleFullscreen}
            onError={(e) => {
              // Fallback for broken images
              e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEyMCIgeT0iODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgcng9IjQiIGZpbGw9IiNEMUQ1REIiLz4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iMTEwIiByPSI4IiBmaWxsPSIjOTdBM0IzIi8+CjxwYXRoIGQ9Ik0xMzAgMTMwTDE1MCAxMTBMMTcwIDEzMEgxMzBaIiBmaWxsPSIjOTdBM0IzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhGIiBmb250LXNpemU9IjE0Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=";
            }}
          />
          
          {/* Image Controls Overlay */}
          {!isFullscreen && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white hover:bg-opacity-20"
                onClick={handleFullscreen}
              >
                <Maximize2 className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* Fullscreen Close Button */}
          {isFullscreen && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 z-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      );
    }

    // Fallback for other content types
    return (
      <div className="bg-gray-100 rounded-lg p-12 text-center">
        {getContentIcon()}
        <p className="text-sm text-gray-600 mt-4 mb-4">
          {content.type} content
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(content.s3Link, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Link
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getContentIcon()}
            <span>Content Review</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Content Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  {content.type} Content #{content.id.slice(-6)}
                </h3>
                <Badge className={`${statusColors[content.status as keyof typeof statusColors]} border`}>
                  {content.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Created:</span>
                  <span>{content.createdAt ? new Date(content.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Updated:</span>
                  <span>{content.updatedAt ? new Date(content.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Content Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Live Preview</h4>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(content.s3Link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>
              {renderMediaPreview()}
            </CardContent>
          </Card>

          {/* Influencer & Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {influencer && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Creator</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {influencer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{influencer.name}</p>
                      <p className="text-sm text-gray-600">{influencer.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {order && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Related Order</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="ml-2 font-mono">#{order.shopifyOrderId}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="outline" className="ml-2">{order.status}</Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Review Actions */}
          {content.status === "PendingReview" && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Review Actions</h4>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleStatusUpdate("Approved")}
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Content
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate("Reassigned")}
                    disabled={isUpdating}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Actions */}
          {content.status === "Approved" && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Publishing Actions</h4>
                <Button 
                  onClick={() => handleStatusUpdate("Scheduled")}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Schedule for Publishing
                </Button>
              </CardContent>
            </Card>
          )}

          {content.status === "Reassigned" && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Feedback</h4>
                <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg">
                  Content has been sent back to the creator for revisions. They will upload a new version for review.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}