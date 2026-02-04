"use client";

import { useCallback } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, limit, doc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Star, UserPlus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formatFlogName = (name: string) => {
    let newName = '';
    for (let i = 0; i < name.length; i++) {
        newName += i % 2 === 0 ? name[i].toLowerCase() : name[i].toUpperCase();
    }
    return `xX_${newName}_Xx`;
};


export default function FavoritesList({ userProfile }: { userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const favoritesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), limit(10));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<UserProfile>(favoritesQuery);

    const handleFollowToggle = useCallback((targetUser: UserProfile) => {
        if (!user || !userProfile) return;

        const isCurrentlyFollowing = userProfile.following?.includes(targetUser.id);
        
        const currentUserDocRef = doc(firestore, 'users', user.uid);
        const targetUserDocRef = doc(firestore, 'users', targetUser.id);
        const targetFlogDocRef = doc(firestore, 'flogs', targetUser.id);

        if (isCurrentlyFollowing) {
            updateDocumentNonBlocking(currentUserDocRef, { following: arrayRemove(targetUser.id) });
            updateDocumentNonBlocking(targetUserDocRef, { followers: arrayRemove(user.uid) });
            updateDocumentNonBlocking(targetFlogDocRef, { followerCount: increment(-1) });
            toast({ description: `Dejaste de seguir a ${targetUser.username}.` });
        } else {
            updateDocumentNonBlocking(currentUserDocRef, { following: arrayUnion(targetUser.id) });
            updateDocumentNonBlocking(targetUserDocRef, { followers: arrayUnion(user.uid) });
            updateDocumentNonBlocking(targetFlogDocRef, { followerCount: increment(1) });
            toast({ description: `Ahora sigues a ${targetUser.username}.` });
        }
    }, [user, userProfile, firestore, toast]);

    return (
        <div className="flog-panel flog-theme-border">
            <h2 className="flog-panel-title flog-theme-text-shadow mb-4 flex items-center gap-2">
                <Star />
                F/F
            </h2>
            <div className="space-y-2">
                {isLoading && (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
                            <div className="flex-1">
                               <Skeleton className="h-4 w-32 bg-slate-700" />
                            </div>
                        </div>
                    ))
                )}
                {users && users.filter(u => u.id !== user?.id).map(targetUser => {
                    const isFollowing = userProfile.following?.includes(targetUser.id) ?? false;
                    return (
                        <div key={targetUser.id} className="flex items-center gap-3 hover:bg-black/20 p-2 rounded-md">
                            <Avatar className="h-10 w-10 border-2 flog-theme-border">
                                <AvatarImage src={targetUser.avatarUrl} />
                                <AvatarFallback>{targetUser.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="ff-name flex-1">{formatFlogName(targetUser.username)}</p>
                            <Button size="sm" className="flog-button" onClick={() => handleFollowToggle(targetUser)}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                {isFollowing ? 'Siguiendo' : 'Seguir'}
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
