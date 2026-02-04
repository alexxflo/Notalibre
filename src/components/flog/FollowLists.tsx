'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

// A component to render a list of users
const UserList = ({ userIds }: { userIds: string[] }) => {
    const firestore = useFirestore();

    // Firestore 'in' queries are limited to 30 items per query.
    // We'll chunk the IDs and make multiple queries if necessary.
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
    }

    // Since hooks can't be in loops, we'll create a component for each chunk.
    return (
         <div className="space-y-2">
            {chunks.map((chunk, index) => (
                <UserListChunk key={index} userIds={chunk} />
            ))}
             {userIds.length === 0 && (
                <p className="text-slate-400 text-center p-4">No hay usuarios que mostrar.</p>
             )}
        </div>
    );
};

const UserListChunk = ({ userIds }: { userIds: string[] }) => {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || userIds.length === 0) return null;
        return query(
            collection(firestore, 'users'),
            where(documentId(), 'in', userIds)
        );
    }, [firestore, userIds]);

    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <>
            {users?.map(user => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-black/20">
                    <Avatar className="h-10 w-10 border-2 flog-theme-border">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-white flex-1">{user.username}</p>
                </div>
            ))}
        </>
    );
}

export default function FollowLists({ userProfile }: { userProfile: UserProfile }) {
    const followers = userProfile.followers || [];
    const following = userProfile.following || [];

    return (
        <div className="flog-panel flog-theme-border">
            <Tabs defaultValue="followers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/30 p-0 h-auto border-2 flog-theme-border rounded-md">
                    <TabsTrigger value="followers" className="flog-button !text-xs !border-0 rounded-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-black/20">
                        Seguidores ({followers.length})
                    </TabsTrigger>
                    <TabsTrigger value="following" className="flog-button !text-xs !border-0 rounded-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-black/20">
                        Siguiendo ({following.length})
                    </TabsTrigger>
                </TabsList>
                <ScrollArea className="h-96 mt-4">
                    <TabsContent value="followers">
                        <UserList userIds={followers} />
                    </TabsContent>
                    <TabsContent value="following">
                        <UserList userIds={following} />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
