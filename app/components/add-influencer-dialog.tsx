import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInfluencerSchema, type InsertInfluencer } from "../../shared/schema";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../hooks/use-toast";
import { z } from "zod";
import { X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(1, "Age must be at least 1"),
  gender: z.string().min(1, "Gender is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  instagramHandle: z.string().optional(),
  instagramFollowers: z.string().optional(),
  youtubeChannel: z.string().optional(),
  youtubeSubscribers: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddInfluencerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddInfluencerDialog({ open, onOpenChange }: AddInfluencerDialogProps) {
  const { addInfluencer } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: undefined,
      gender: "",
      phone: "",
      email: "",
      address: "",
      instagramHandle: "",
      instagramFollowers: "",
      youtubeChannel: "",
      youtubeSubscribers: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const socialMedia: any = {};
      
      if (data.instagramHandle) {
        socialMedia.instagram = {
          handle: data.instagramHandle,
          followers: parseInt(data.instagramFollowers || "0"),
        };
      }
      
      if (data.youtubeChannel) {
        socialMedia.youtube = {
          channel: data.youtubeChannel,
          subscribers: parseInt(data.youtubeSubscribers || "0"),
        };
      }

      const influencerData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        socialMedia,
        status: "PendingApproval" as const,
      } as any; // Use any to bypass type checking for now

      await addInfluencer(influencerData);
      toast({
        title: "Success",
        description: "Influencer added successfully",
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add influencer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border-0 shadow-xl rounded-lg">
        <DialogHeader className="relative pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 text-center">Add New Influencer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1 block">Full Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter full name"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="age" className="text-sm font-medium text-gray-700 mb-1 block">Age</Label>
                <Input
                  id="age"
                  type="number"
                  {...form.register("age", { valueAsNumber: true })}
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-1 block">Gender</Label>
                <Select onValueChange={(value) => form.setValue("gender", value)}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 shadow-lg">
                    <SelectItem value="Female" className="text-gray-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600">
                      Female
                    </SelectItem>
                    <SelectItem value="Male" className="text-gray-900 hover:bg-gray-50">
                      Male
                    </SelectItem>
                    <SelectItem value="Other" className="text-gray-900 hover:bg-gray-50">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="email@example.com"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1 block">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+1 (555) 123-4567"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1 block">Address</Label>
              <Input
                id="address"
                {...form.register("address")}
                placeholder="Full address"
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Social Media Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Social Media (Optional)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagramHandle" className="text-sm font-medium text-gray-700 mb-1 block">Instagram Handle</Label>
                <Input
                  id="instagramHandle"
                  {...form.register("instagramHandle")}
                  placeholder="Enter Instagram handle"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="instagramFollowers" className="text-sm font-medium text-gray-700 mb-1 block">Followers</Label>
                <Input
                  id="instagramFollowers"
                  type="number"
                  {...form.register("instagramFollowers")}
                  placeholder="Enter follower count"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="youtubeChannel" className="text-sm font-medium text-gray-700 mb-1 block">YouTube Channel</Label>
                <Input
                  id="youtubeChannel"
                  {...form.register("youtubeChannel")}
                  placeholder="Enter YouTube channel name"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="youtubeSubscribers" className="text-sm font-medium text-gray-700 mb-1 block">Subscribers</Label>
                <Input
                  id="youtubeSubscribers"
                  type="number"
                  {...form.register("youtubeSubscribers")}
                  placeholder="Enter subscriber count"
                  className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Influencer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}