'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { FlogProfile, UserProfile } from '@/types';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, increment, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, ThumbsUp, ThumbsDown, X, Heart, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const FlogCard = ({ flog, onDislike, onLike, onFollow, isFollowing }: { flog: FlogProfile, onDislike: () => void, onLike: () => void, onFollow: () => void, isFollowing: boolean }) => {
    return (
        <div className="flog-panel flog-theme-border flog-theme-shadow relative w-full max-w-md mx-auto aspect-[3/4] flex flex-col">
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 p-2 rounded-lg z-10">
                <p className="font-bold text-white">{flog.username}</p>
            </div>
             <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 p-2 rounded-lg z-10 text-white">
                <Users className="h-4 w-4" />
                <span className="font-bold text-sm">{flog.followerCount ?? 0}</span>
            </div>

            <Image
                src={flog.mainPhotoUrl || 'https://placehold.co/800x600'}
                alt={`Flog photo by ${flog.username}`}
                fill
                className="object-cover rounded-md"
                unoptimized
            />

            <div className="mt-auto p-4 bg-gradient-to-t from-black/80 to-transparent space-y-2 z-10">
                <p className="text-white text-sm description-box bg-transparent border-none p-0 max-h-20 overflow-y-auto">{flog.description}</p>
                <div className="flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5" />
                        <span>{flog.likes ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThumbsDown className="h-5 w-5" />
                        <span>{flog.dislikes ?? 0}</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-[-70px] left-1/2 -translate-x-1/2 flex items-center gap-4">
                <Button onClick={onDislike} variant="outline" size="icon" className="h-16 w-16 rounded-full bg-black/50 border-2 border-red-500 text-red-500 hover:bg-red-900/50 hover:text-red-400">
                    <X className="h-8 w-8" />
                </Button>
                <Button onClick={onFollow} variant="outline" size="icon" className={`h-20 w-20 rounded-full bg-black/50 border-2  hover:bg-blue-900/50 ${isFollowing ? 'border-blue-400 text-blue-400' : 'border-slate-500 text-slate-400'}`}>
                    <UserPlus className="h-8 w-8" />
                </Button>
                 <Button onClick={onLike} variant="outline" size="icon" className="h-16 w-16 rounded-full bg-black/50 border-2 border-green-500 text-green-500 hover:bg-green-900/50 hover:text-green-400">
                    <Heart className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
};


export default function FlogFeed({ userProfile, setView }: { userProfile: UserProfile, setView: (view: any) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }); // Loop should be false for a finite list
    const { toast } = useToast();

    const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
    const [selectedFlog, setSelectedFlog] = useState<FlogProfile | null>(null);
    const [newSignature, setNewSignature] = useState('');

    const flogsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'flogs'));
    }, [firestore]);

    const { data: flogs, isLoading } = useCollection<FlogProfile>(flogsQuery);

    const filteredFlogs = useMemo(() => {
        if (!flogs || !user) return [];
        const interactedIds = new Set(userProfile.interactedFlogIds || []);
        return flogs.filter(flog => flog.userId !== user.uid && !interactedIds.has(flog.id));
    }, [flogs, user, userProfile]);

    useEffect(() => {
      if (!isLoading && filteredFlogs && filteredFlogs.length === 0) {
        toast({
            title: "¡Estás al día!",
            description: "No hay nuevos Flogs para mostrar. Vuelve más tarde.",
        });
        setView('panel');
      }
    }, [isLoading, filteredFlogs, setView, toast]);


    const markAsInteracted = useCallback((flogId: string) => {
        if (!user) return;
        const userDocRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userDocRef, {
            interactedFlogIds: arrayUnion(flogId)
        });
    }, [user, firestore]);

    const handleDislike = useCallback((flog: FlogProfile) => {
        if (!user) return;
        const flogDocRef = doc(firestore, 'flogs', flog.id);
        updateDocumentNonBlocking(flogDocRef, { dislikes: increment(1) });
        markAsInteracted(flog.id);
        toast({ description: `Le diste "No me gusta" a ${flog.username}.` });
        emblaApi?.scrollNext();
    }, [firestore, user, emblaApi, toast, markAsInteracted]);

    const handleLikeClick = useCallback((flog: FlogProfile) => {
        if (!user) return;
        setSelectedFlog(flog);
        setIsSignDialogOpen(true);
    }, [user]);

    const handleConfirmLikeAndSignature = useCallback(() => {
        if (!selectedFlog || !user || !userProfile) return;

        const flogDocRef = doc(firestore, 'flogs', selectedFlog.id);
        updateDocumentNonBlocking(flogDocRef, { likes: increment(1) });

        if (newSignature.trim()) {
            const signaturesCollection = collection(firestore, 'flogs', selectedFlog.id, 'signatures');
            addDocumentNonBlocking(signaturesCollection, {
                authorId: user.uid,
                authorUsername: userProfile.username,
                authorAvatar: userProfile.avatarUrl,
                text: newSignature,
                createdAt: serverTimestamp(),
            });
             toast({ description: `¡Like y firma enviados a ${selectedFlog.username}!` });
        } else {
             toast({ description: `¡Like enviado a ${selectedFlog.username}!` });
        }
        
        markAsInteracted(selectedFlog.id);
       
        setNewSignature('');
        setIsSignDialogOpen(false);
        setSelectedFlog(null);
        emblaApi?.scrollNext();

    }, [selectedFlog, newSignature, user, userProfile, firestore, toast, emblaApi, markAsInteracted]);
    
    const handleFollowToggle = useCallback((flogToFollow: FlogProfile) => {
        if (!user || !userProfile) return;

        const isCurrentlyFollowing = userProfile.following?.includes(flogToFollow.userId);
        
        const currentUserDocRef = doc(firestore, 'users', user.uid);
        const targetFlogDocRef = doc(firestore, 'flogs', flogToFollow.userId);

        if (isCurrentlyFollowing) {
            // Unfollow logic
            updateDocumentNonBlocking(currentUserDocRef, {
                following: arrayRemove(flogToFollow.userId)
            });
            updateDocumentNonBlocking(targetFlogDocRef, {
                followerCount: increment(-1)
            });
            toast({ description: `Dejaste de seguir a ${flogToFollow.username}.` });
        } else {
            // Follow logic
            updateDocumentNonBlocking(currentUserDocRef, {
                following: arrayUnion(flogToFollow.userId)
            });
            updateDocumentNonBlocking(targetFlogDocRef, {
                followerCount: increment(1)
            });
            toast({ description: `Ahora sigues a ${flogToFollow.username}.` });
        }
    }, [user, userProfile, firestore, toast]);


    if (isLoading) {
        return <Loader2 className="h-16 w-16 animate-spin text-cyan-400 my-16 mx-auto" />;
    }
    
    if (!filteredFlogs || filteredFlogs.length === 0) {
        // This view is shown briefly before the useEffect hook redirects. A loader is appropriate.
        return <Loader2 className="h-16 w-16 animate-spin text-cyan-400 my-16 mx-auto" />;
    }

    return (
        <>
            <div className="overflow-hidden w-full" ref={emblaRef}>
                <div className="flex">
                    {filteredFlogs.map((flog) => (
                         <div className="min-w-0 flex-[0_0_100%] flex justify-center" key={flog.id}>
                            <div className='w-full max-w-md pb-24'>
                                <FlogCard 
                                    flog={flog} 
                                    onDislike={() => handleDislike(flog)} 
                                    onLike={() => handleLikeClick(flog)}
                                    onFollow={() => handleFollowToggle(flog)}
                                    isFollowing={userProfile.following?.includes(flog.userId) ?? false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
                <DialogContent className="flog-mode flog-panel flog-theme-border">
                    <DialogHeader>
                        <DialogTitle className="flog-panel-title flog-theme-text-shadow">Dejar Firma y Like</DialogTitle>
                        <DialogDescription>
                            Estás interactuando con el flog de <span className="flog-theme-color font-bold">{selectedFlog?.username}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Escribe tu firma aquí (opcional)..."
                            value={newSignature}
                            onChange={(e) => setNewSignature(e.target.value)}
                            className="flog-textarea flog-theme-outline"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleConfirmLikeAndSignature} className="flog-button">
                            <Heart className="w-4 h-4 mr-2" />
                            Enviar Like y Firma
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
