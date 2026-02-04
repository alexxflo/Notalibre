"use client";

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Star } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formatFlogName = (name: string) => {
    let newName = '';
    for (let i = 0; i < name.length; i++) {
        newName += i % 2 === 0 ? name[i].toLowerCase() : name[i].toUpperCase();
    }
    return `xX_${newName}_Xx`;
};


export default function FavoritesList() {
    const firestore = useFirestore();

    const favoritesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), limit(10));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<UserProfile>(favoritesQuery);

    return (
        <div className="flog-panel flog-theme-border">
            <h2 className="flog-panel-title flog-theme-text-shadow mb-4 flex items-center gap-2">
                <Star />
                F/F
            </h2>
            <div className="space-y-4">
                {isLoading && (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full bg-slate-700" />
                            <Skeleton className="h-4 w-32 bg-slate-700" />
                        </div>
                    ))
                )}
                {users && users.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 flog-theme-border">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="ff-name">{formatFlogName(user.username)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
