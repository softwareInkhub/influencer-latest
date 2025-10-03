import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, VideoIcon, File, CheckCircle, X } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import type { Order } from "../../shared/schema";

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

export default function VideoUploadDialog({ open, onOpenChange, order }: VideoUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState("Video");
  const [description, setDescription] = useState("");
  const { addContent, influencers } = useApp();

  const influencer = order ? influencers.find(inf => inf.id === order.influencerId) : null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const simulateUpload = (): Promise<string> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            resolve(`https://demo-bucket.s3.amazonaws.com/uploads/${selectedFile?.name || 'video'}-${Date.now()}`);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !order) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload to S3
      const s3Link = await simulateUpload();
      
      // Create content entry
      await addContent({
        type: contentType,
        s3Link,
        status: "PendingReview",
        influencerId: order.influencerId,
        orderId: order.id,
        companyId: order.companyId,
        editedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form
      setSelectedFile(null);
      setDescription("");
      setUploadProgress(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideoFile = (file: File) => {
    return file.type.startsWith('video/');
  };

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Content</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order Information */}
          {order && influencer && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">Upload for Order</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {influencer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{influencer.name}</p>
                    <p className="text-sm text-gray-600">Order #{order.shopifyOrderId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="Video" className="text-gray-900 hover:bg-gray-100">Video</SelectItem>
                <SelectItem value="Image" className="text-gray-900 hover:bg-gray-100">Image</SelectItem>
                <SelectItem value="Story" className="text-gray-900 hover:bg-gray-100">Story</SelectItem>
                <SelectItem value="Reel" className="text-gray-900 hover:bg-gray-100">Reel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    {isVideoFile(selectedFile) && <VideoIcon className="w-8 h-8 text-purple-600" />}
                    {isImageFile(selectedFile) && <File className="w-8 h-8 text-blue-600" />}
                    {!isVideoFile(selectedFile) && !isImageFile(selectedFile) && <File className="w-8 h-8 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600">Drop your file here or</p>
                    <Label 
                      htmlFor="file-upload" 
                      className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                    >
                      browse files
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports: MP4, MOV, AVI (videos) • JPG, PNG, GIF (images)
                  </p>
                </div>
              )}
              <Input
                id="file-upload"
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Upload Actions */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Content</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}