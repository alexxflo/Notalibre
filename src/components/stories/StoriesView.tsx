'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Story, UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageSquare, Send, X, Trash2, ChevronLeft, ChevronRight, Loader2, Play, Pause } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"


type StoriesViewProps = {
  groupedStories: Story[][];
  currentUserProfile: UserProfile;
};

export default function StoriesView({ groupedStories, currentUserProfile }: StoriesViewProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const currentUserStories = groupedStories[selectedUserIndex];
  const currentStory = currentUserStories?.[currentStoryIndex];

  useEffect(() => {
    if (api) {
      api.on("select", () => {
        setSelectedUserIndex(api.selectedScrollSnap());
        setCurrentStoryIndex(0);
        setProgress(0);
      });
    }
  }, [api]);

  useEffect(() => {
    if (!currentStory || isPaused) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (videoElement.duration) {
        setProgress((videoElement.currentTime / videoElement.duration) * 100);
      }
    };
    
    const handleVideoEnd = () => {
      if (currentStoryIndex < currentUserStories.length - 1) {
        setCurrentStoryIndex(prev => prev + 1);
      } else {
        // Go to next user if available
        if (selectedUserIndex < groupedStories.length - 1) {
          api?.scrollNext();
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleVideoEnd);
    videoElement.play().catch(e => console.error("Video play failed:", e));

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleVideoEnd);
    };
  }, [currentStoryIndex, selectedUserIndex, currentUserStories, api, isPaused, currentStory]);

  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);
    if(videoRef.current) {
        videoRef.current.currentTime = 0;
    }
  }, [currentStoryIndex, selectedUserIndex]);

  if (!currentStory) {
    return (
        <div className="w-full max-w-md h-[80vh] bg-card rounded-2xl flex items-center justify-center">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
        </div>
    );
  }
  
  const handleLike = () => {
    const storyRef = doc(firestore, 'stories', currentStory.id);
    if (currentStory.likes.includes(currentUserProfile.id)) {
        updateDoc(storyRef, { likes: arrayRemove(currentUserProfile.id) });
    } else {
        updateDoc(storyRef, { likes: arrayUnion(currentUserProfile.id) });
    }
  };

  const handleDelete = async () => {
      if(currentUserProfile.id !== currentStory.userId) return;
      const storyRef = doc(firestore, 'stories', currentStory.id);
      await deleteDoc(storyRef);
      toast({ description: "Historia eliminada." });
      // Logic to move to next story or close view would be needed here
      // For simplicity, we can just reload. In a real app, you'd manage state better.
      window.location.reload();
  }
  
  const isLiked = currentStory.likes.includes(currentUserProfile.id);
  const isOwner = currentUserProfile.id === currentStory.userId;

  return (
    <div className="w-full max-w-6xl">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
            {groupedStories.map((userStories, index) => (
              <CarouselItem key={userStories[0].userId} className="md:basis-1/2 lg:basis-1/3 flex justify-center">
                 <div className="p-1">
                    <Avatar 
                        className={cn(
                            "h-24 w-24 border-4 cursor-pointer transition-all hover:scale-105",
                             selectedUserIndex === index ? "border-primary" : "border-muted"
                        )}
                        onClick={() => api?.scrollTo(index)}
                    >
                        <AvatarImage src={userStories[0].avatarUrl} />
                        <AvatarFallback>{userStories[0].username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-center mt-2 text-white font-semibold truncate">{userStories[0].username}</p>
                 </div>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <div className="relative w-full max-w-md mx-auto mt-8 h-[80vh] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary">
        <video ref={videoRef} key={currentStory.id} src={currentStory.videoUrl} className="w-full h-full object-cover" onClick={() => setIsPaused(!isPaused)} playsInline />
        
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2 mb-2">
                {currentUserStories.map((_, index) => (
                    <div key={index} className="flex-1 h-1 bg-white/30 rounded-full">
                       <div 
                         className="h-1 bg-white rounded-full"
                         style={{ width: `${index < currentStoryIndex ? 100 : (index === currentStoryIndex ? progress : 0)}%` }}
                        />
                    </div>
                ))}
            </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={currentStory.avatarUrl} />
                        <AvatarFallback>{currentStory.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-white font-bold">{currentStory.username}</p>
                </div>
                 {isOwner && (
                    <Button variant="ghost" size="icon" onClick={handleDelete} className="text-white hover:text-red-500">
                        <Trash2 />
                    </Button>
                )}
            </div>
        </div>

        {isPaused && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Play className="h-24 w-24 text-white/80" />
            </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-end gap-4">
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleLike} className={cn("text-white rounded-full", isLiked && "text-red-500 bg-white/20")}>
                    <Heart />
                </Button>
                <span className="text-white font-bold">{currentStory.likes.length}</span>
           </div>
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white rounded-full">
                    <MessageSquare />
                </Button>
                 <span className="text-white font-bold">{currentStory.comments.length}</span>
           </div>
        </div>

        {/* Story navigation overlays */}
        <div className="absolute left-0 top-0 h-full w-1/3" onClick={() => {
            if (currentStoryIndex > 0) setCurrentStoryIndex(prev => prev - 1)
            else if (selectedUserIndex > 0) api?.scrollPrev();
        }} />
        <div className="absolute right-0 top-0 h-full w-1/3" onClick={() => {
            if (currentStoryIndex < currentUserStories.length - 1) setCurrentStoryIndex(prev => prev + 1);
            else if (selectedUserIndex < groupedStories.length - 1) api?.scrollNext();
        }} />
      </div>
    </div>
  );
}
