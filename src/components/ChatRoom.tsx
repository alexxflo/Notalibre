'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import type { ChatMessage, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChatRoom({ userProfile }: { userProfile: UserProfile | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<ChatMessage>(messagesQuery);

  const reversedMessages = useMemo(() => messages?.slice().reverse() ?? [], [messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to get the viewport element from the ScrollArea component
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [reversedMessages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !userProfile || !newMessage.trim()) return;

    const messagesCollection = collection(firestore, 'messages');
    addDocumentNonBlocking(messagesCollection, {
      userId: user.uid,
      username: userProfile.username,
      avatarUrl: userProfile.avatarUrl,
      text: newMessage,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-magenta-600 hover:bg-magenta-500 text-white shadow-lg animate-pulse border-2 border-magenta-400"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col bg-slate-900 border-slate-700 p-0">
        <SheetHeader className="p-4 border-b border-slate-700">
          <SheetTitle className="text-magenta-400 font-headline">Chat Global</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          {isLoading && (
             <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-magenta-400" />
            </div>
          )}
          <div className="space-y-4">
            {reversedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.userId === user?.uid ? 'justify-end' : ''
                }`}
              >
                {msg.userId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.avatarUrl} alt={msg.username} />
                        <AvatarFallback>{msg.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={`flex flex-col ${
                    msg.userId === user?.uid ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs md:max-w-sm ${
                      msg.userId === user?.uid
                        ? 'bg-magenta-700 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                     {msg.userId !== user?.uid && <span className="font-semibold">{msg.username} &middot; </span>}
                     {msg.createdAt
                      ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: es })
                      : 'enviando...'}
                  </span>
                </div>
                 {msg.userId === user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.avatarUrl} alt={msg.username} />
                        <AvatarFallback>{msg.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-700 flex items-center gap-2 bg-slate-900"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="bg-slate-800 border-slate-600 focus:ring-magenta-500"
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="bg-magenta-600 hover:bg-magenta-500" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
