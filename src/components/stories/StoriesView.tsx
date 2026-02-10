'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Story, UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Trash2, Loader2, Play, Pause, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import StoryCommentSection from './StoryCommentSection';

type StoriesViewProps = {
  groupedStories: Story[][];
  currentUserProfile: UserProfile;
  initialUserIndex: number;
};

const IMAGE_STORY_DURATION_MS = 10000; // 10 seconds

export default function StoriesView({ groupedStories, currentUserProfile, initialUserIndex }: StoriesViewProps) {
  const [selectedUserIndex, setSelectedUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const currentUserStories = groupedStories[selectedUserIndex] ?? [];
  const currentStory = currentUserStories[currentStoryIndex];

  const goToNextStory = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (selectedUserIndex < groupedStories.length - 1) {
      setSelectedUserIndex(prev => prev + 1);
    } else {
      router.push('/'); // Go home if it's the very last story
    }
  };

  const goToPrevStory = () => {
     if (currentStoryIndex > 0) {
        setCurrentStoryIndex(prev => prev - 1);
     }
  };

  // Effect to handle user/story navigation and reset state
  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  }, [selectedUserIndex]);

  // Combined effect for both video and image stories
  useEffect(() => {
    if (!currentStory) return;

    // Cleanup function for timers and listeners
    const cleanup = () => {
        if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        const video = videoRef.current;
        if (video) {
            if (!video.paused) video.pause();
            video.removeAttribute('src'); // Detach source
            video.load();
        }
    };
    
    cleanup();
    setProgress(0);

    // Mark as viewed
    if (currentUserProfile && !(currentStory.views ?? []).includes(currentUserProfile.id)) {
        const storyRef = doc(firestore, 'stories', currentStory.id);
        updateDocumentNonBlocking(storyRef, { views: arrayUnion(currentUserProfile.id) });
    }
    
    if (isPaused) return;

    if (currentStory.mediaType === 'image') {
        let startTime = Date.now();
        progressIntervalRef.current = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = (elapsedTime / IMAGE_STORY_DURATION_MS) * 100;
            if (newProgress < 100) {
                setProgress(newProgress);
            } else {
                setProgress(100);
            }
        }, 100);

        imageTimerRef.current = setTimeout(() => {
            goToNextStory();
        }, IMAGE_STORY_DURATION_MS);
    } 
    else if (currentStory.mediaType === 'video') {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.duration > 0) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };
        const handleCanPlay = () => {
            const playPromise = video.play();
            playPromise?.catch(e => {
                if (e.name !== "AbortError") console.error("Video play failed", e)
            });
        };
        const handleEnded = () => goToNextStory();

        video.src = currentStory.mediaUrl;
        video.load();
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('ended', handleEnded);
        };
    }

    return cleanup;
  }, [currentStory, isPaused]); // Re-run when story or paused state changes.

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
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storyRef = doc(firestore, 'stories', currentStory.id);
    if ((currentStory.likes ?? []).includes(currentUserProfile.id)) {
      updateDocumentNonBlocking(storyRef, { likes: arrayRemove(currentUserProfile.id) });
    } else {
      updateDocumentNonBlocking(storyRef, { likes: arrayUnion(currentUserProfile.id) });
    }
  };

  const handleDelete = () => {
    if (currentUserProfile.id !== currentStory.userId) return;
    const storyRef = doc(firestore, 'stories', currentStory.id);
    deleteDocumentNonBlocking(storyRef);
    toast({ description: "Historia eliminada." });
    router.push('/'); // Redirect after deletion
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent story from pausing/unpausing
    setIsPaused(true);
    setIsCommentSheetOpen(true);
  };

  const isLiked = (currentStory.likes ?? []).includes(currentUserProfile.id);
  const isOwner = currentUserProfile.id === currentStory.userId;

  return (
    <>
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

        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-border" onClick={() => setIsPaused(!isPaused)}>
          {currentStory.mediaType === 'video' ? (
            <video 
              ref={videoRef} 
              key={currentStory.id} // Force re-mount on story change
              className="w-full h-full object-cover" 
              playsInline 
              muted 
            />
          ) : (
            currentStory.mediaUrl && (
              <Image 
                key={currentStory.id}
                src={currentStory.mediaUrl}
                alt="Story image"
                fill
                className="object-contain"
                priority
              />
            )
          )}
          
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-20">
            <div className="flex items-center gap-2 mb-2">
              {currentUserStories.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-1 bg-white rounded-full"
                    style={{ width: `${index < currentStoryIndex ? 100 : (index === currentStoryIndex ? progress : 0)}%`, transition: index === currentStoryIndex ? 'width 100ms linear' : 'none' }}
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
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-10">
              {currentStory.mediaType === 'video' ? <Play className="h-24 w-24 text-white/80" /> : <Pause className="h-24 w-24 text-white/80" />}
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-end gap-4 z-20">
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
              <Button variant="ghost" size="icon" onClick={handleCommentClick} className="text-white rounded-full">
                <MessageSquare />
              </Button>
              <span className="text-white font-bold">{currentStory.commentCount ?? 0}</span>
            </div>
          </div>

          {/* Story navigation overlays */}
          <div className="absolute left-0 top-0 h-full w-1/3 z-10" onClick={(e) => {
              e.stopPropagation();
              goToPrevStory();
          }} />
          <div className="absolute right-0 top-0 h-full w-1/3 z-10" onClick={(e) => {
              e.stopPropagation();
              goToNextStory();
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

      <Sheet open={isCommentSheetOpen} onOpenChange={(isOpen) => {
        setIsCommentSheetOpen(isOpen);
        if (!isOpen) {
          setIsPaused(false);
        }
      }}>
        <SheetContent className="flex flex-col bg-card border-border">
          <SheetHeader>
              <SheetTitle>Comentarios</SheetTitle>
          </SheetHeader>
          <StoryCommentSection 
            storyId={currentStory.id} 
            currentUserProfile={currentUserProfile} 
            storyOwnerId={currentStory.userId} 
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
