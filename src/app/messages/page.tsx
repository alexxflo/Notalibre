'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, Chat, PrivateMessage } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Search, Users, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function MessagesContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<{ id: string, otherParticipant: UserProfile } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If auth is finished loading and there's no user, redirect to home page.
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const currentUserProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

  // Query to get all chats the user is a part of, without ordering.
  // This avoids the need for a composite index in Firestore.
  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', user.uid));
  }, [firestore, user]);

  const { data: rawChats, isLoading: areChatsLoading } = useCollection<Chat>(chatsQuery);

  // Sort the chats on the client-side by the last message timestamp.
  const chats = useMemo(() => {
    if (!rawChats) return [];
    return rawChats.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.toMillis() || 0;
      const bTime = b.lastMessage?.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  }, [rawChats]);


  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedChat) return null;
    return query(collection(firestore, 'chats', selectedChat.id, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, selectedChat]);
  const { data: messages, isLoading: areMessagesLoading } = useCollection<PrivateMessage>(messagesQuery);

  useEffect(() => {
    if (firestore) {
      const usersCollection = collection(firestore, 'users');
      getDocs(usersCollection).then(snapshot => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setAllUsers(usersData);
      });
    }
  }, [firestore]);
  
   useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const chatWithId = searchParams.get('chatWith');
    if (chatWithId && allUsers.length > 0 && user) {
        handleUserSelect(allUsers.find(u => u.id === chatWithId) || null);
    }
  }, [searchParams, allUsers, user]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    return allUsers.filter(u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) && u.id !== user?.uid
    );
  }, [searchQuery, allUsers, user]);

  const handleUserSelect = async (targetUser: UserProfile | null) => {
    if (!targetUser || !user || !currentUserProfile) return;

    const chatId = [user.uid, targetUser.id].sort().join('_');
    const chatRef = doc(firestore, 'chats', chatId);
    
    const participantsData = {
        [user.uid]: { username: currentUserProfile.username, avatarUrl: currentUserProfile.avatarUrl },
        [targetUser.id]: { username: targetUser.username, avatarUrl: targetUser.avatarUrl },
    };

    // Use setDoc with merge:true. This will create the chat if it doesn't exist,
    // or merge the fields if it does. This avoids the problematic `getDoc` call.
    await setDoc(chatRef, {
      participantIds: [user.uid, targetUser.id],
      participants: participantsData,
    }, { merge: true });

    setSelectedChat({ id: chatId, otherParticipant: targetUser });
    setSearchQuery('');
  };
  
  const handleChatSelect = (chat: Chat) => {
    if (!user) return;
    const otherParticipantId = chat.participantIds.find(id => id !== user.uid);
    if (!otherParticipantId) return;

    const otherParticipant = chat.participants?.[otherParticipantId];
    if (!otherParticipant) return;

    setSelectedChat({
      id: chat.id,
      otherParticipant: {
        id: otherParticipantId,
        ...otherParticipant,
      } as UserProfile
    });
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedChat || !newMessage.trim() || !currentUserProfile) return;

    const chatRef = doc(firestore, 'chats', selectedChat.id);
    const messagesCollection = collection(chatRef, 'messages');

    const messageData = {
      senderId: currentUserProfile.id,
      senderUsername: currentUserProfile.username,
      senderAvatarUrl: currentUserProfile.avatarUrl,
      text: newMessage,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(messagesCollection, messageData);

    updateDocumentNonBlocking(chatRef, {
      lastMessage: {
        text: newMessage,
        senderId: currentUserProfile.id,
        createdAt: serverTimestamp(),
      },
    });

    setNewMessage('');
  };

  if (isUserLoading || !user || !currentUserProfile) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100vh-100px)]">
          
          {/* Left Column: Search and Chat List */}
          <div className="md:col-span-1 lg:col-span-1 bg-card border border-border rounded-lg flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {searchQuery ? (
                // Search Results
                filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <div key={u.id} onClick={() => handleUserSelect(u)} className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer">
                      <Avatar>
                        <AvatarImage src={u.avatarUrl} alt={u.username} />
                        <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{u.username}</p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground">No se encontraron usuarios.</p>
                )
              ) : (
                // Chat List
                areChatsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>
                ) : chats && chats.length > 0 ? (
                  chats.map(chat => {
                    const otherId = chat.participantIds.find(id => id !== user?.uid);
                    if (!otherId || !chat.participants?.[otherId]) return null;
                    const otherUser = chat.participants[otherId];
                    return (
                    <div key={chat.id} onClick={() => handleChatSelect(chat)} className={cn("flex items-start gap-3 p-3 hover:bg-accent cursor-pointer border-l-4", selectedChat?.id === chat.id ? "border-primary bg-accent" : "border-transparent")}>
                      <Avatar>
                        <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
                        <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{otherUser.username}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.lastMessage?.text}</p>
                      </div>
                    </div>
                  )})
                ) : (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                     <Users className="w-12 h-12" />
                    <p className="font-semibold">No tienes chats activos.</p>
                    <p>Usa la barra de búsqueda para encontrar a alguien y empezar a chatear.</p>
                  </div>
                )
              )}
            </ScrollArea>
          </div>

          {/* Right Column: Chat Area */}
          <div className="md:col-span-2 lg:col-span-3 bg-card border border-border rounded-lg flex flex-col">
            {selectedChat ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedChat.otherParticipant.avatarUrl} />
                    <AvatarFallback>{selectedChat.otherParticipant.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold font-headline">{selectedChat.otherParticipant.username}</h2>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {areMessagesLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>}
                    {messages?.map((msg) => (
                      <div key={msg.id} className={cn("flex items-end gap-3 max-w-lg", msg.senderId === user?.uid ? "ml-auto flex-row-reverse" : "mr-auto")}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.senderAvatarUrl} alt={msg.senderUsername} />
                          <AvatarFallback>{msg.senderUsername.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                           <div className={cn("rounded-lg px-3 py-2", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                              <p className="text-sm">{msg.text}</p>
                           </div>
                           <span className={cn("text-xs text-muted-foreground", msg.senderId === user?.uid && "text-right")}>
                            {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: es }) : 'enviando...'}
                           </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="bg-background"
                      autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || areMessagesLoading}><Send /></Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-24 h-24 mb-4" />
                <h2 className="text-2xl font-bold">Selecciona un chat</h2>
                <p>Elige una conversación o busca un nuevo usuario para empezar a chatear.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <MessagesContent />
        </Suspense>
    )
}
