'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Story, UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Trash2, Loader2, Play, Pause, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type StoriesViewProps = {
  groupedStories: Story[][];
  currentUserProfile: UserProfile;
  initialUserIndex: number;
};

export default function StoriesView({ groupedStories, currentUserProfile, initialUserIndex }: StoriesViewProps) {
  const [selectedUserIndex, setSelectedUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const currentUserStories = groupedStories[selectedUserIndex] ?? [];
  const currentStory = currentUserStories[currentStoryIndex];

  // Effect to handle user/story navigation and reset state
  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  }, [selectedUserIndex]);

  // Main video effect to handle source changes, listeners, and playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentStory) return;

    let canPlay = false;

    const handleCanPlay = () => {
      canPlay = true;
      if (!isPaused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Video play failed:', error);
              setIsPaused(true); // Pause if play fails for other reasons
            }
          });
        }
      }
      
      // Mark as viewed
      if (currentUserProfile && !(currentStory.views ?? []).includes(currentUserProfile.id)) {
        const storyRef = doc(firestore, 'stories', currentStory.id);
        updateDoc(storyRef, { views: arrayUnion(currentUserProfile.id) }).catch(console.error);
      }
    };

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      if (currentStoryIndex < currentUserStories.length - 1) {
        setCurrentStoryIndex(prev => prev + 1);
      } else if (selectedUserIndex < groupedStories.length - 1) {
        setSelectedUserIndex(prev => prev + 1);
      } else {
        router.push('/'); // Go home if it's the very last story
      }
    };
    
    // Set up
    setProgress(0);
    video.src = currentStory.videoUrl;
    video.load(); // Important: force load the new source
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (!video.paused) {
          video.pause();
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [currentStory, isPaused]); // isPaused is a dependency to re-trigger play if unpaused

  if (!currentStory) {
    return (
      <div className="w-full max-w-md h-[90vh] bg-card rounded-2xl flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
      </div>
    );
  }

  const navigateUser = (direction: 'next' | 'prev') => {
      const newUserIndex = direction === 'next' ? selectedUserIndex + 1 : selectedUserIndex - 1;
      if (newUserIndex >= 0 && newUserIndex < groupedStories.length) {
          setSelectedUserIndex(newUserIndex);
      }
  };
  
  const handleLike = () => {
    const storyRef = doc(firestore, 'stories', currentStory.id);
    if ((currentStory.likes ?? []).includes(currentUserProfile.id)) {
      updateDoc(storyRef, { likes: arrayRemove(currentUserProfile.id) });
    } else {
      updateDoc(storyRef, { likes: arrayUnion(currentUserProfile.id) });
    }
  };

  const handleDelete = async () => {
    if (currentUserProfile.id !== currentStory.userId) return;
    const storyRef = doc(firestore, 'stories', currentStory.id);
    
    try {
      await deleteDoc(storyRef);
      toast({ description: "Historia eliminada." });
      router.push('/'); // Redirect after deletion
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la historia.' });
    }
  };

  const isLiked = (currentStory.likes ?? []).includes(currentUserProfile.id);
  const isOwner = currentUserProfile.id === currentStory.userId;

  return (
    <div className="relative w-full max-w-md mx-auto h-[90vh] flex items-center justify-center">
      {/* Prev User Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-[-50px] top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={() => navigateUser('prev')}
        disabled={selectedUserIndex === 0}
      >
        <ChevronLeft className="h-8 w-8"/>
      </Button>

      <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-border">
        <video 
          ref={videoRef} 
          key={currentStory.id} // Force re-mount on story change
          className="w-full h-full object-cover" 
          onClick={() => setIsPaused(!isPaused)} 
          playsInline 
          muted 
        />
        
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            {currentUserStories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-1 bg-white rounded-full transition-all duration-100 ease-linear"
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <Play className="h-24 w-24 text-white/80" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white rounded-full">
              <Eye />
            </Button>
            <span className="text-white font-bold">{(currentStory.views ?? []).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLike} className={cn("text-white rounded-full", isLiked && "text-red-500 bg-white/20")}>
              <Heart />
            </Button>
            <span className="text-white font-bold">{(currentStory.likes ?? []).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white rounded-full">
              <MessageSquare />
            </Button>
            <span className="text-white font-bold">{(currentStory.comments ?? []).length}</span>
          </div>
        </div>

        {/* Story navigation overlays */}
        <div className="absolute left-0 top-0 h-full w-1/3" onClick={() => {
          if (currentStoryIndex > 0) setCurrentStoryIndex(prev => prev - 1);
        }} />
        <div className="absolute right-0 top-0 h-full w-1/3" onClick={() => {
          if (currentStoryIndex < currentUserStories.length - 1) setCurrentStoryIndex(prev => prev + 1);
        }} />
      </div>

       {/* Next User Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-[-50px] top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={() => navigateUser('next')}
        disabled={selectedUserIndex === groupedStories.length - 1}
      >
        <ChevronRight className="h-8 w-8"/>
      </Button>
    </div>
  );
}
