'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { Send, Loader2 } from 'lucide-react';
import type { PrivateMessage, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

type PrivateChatProps = {
  currentUser: UserProfile;
  targetUser: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PrivateChat({
  currentUser,
  targetUser,
  open,
  onOpenChange,
}: PrivateChatProps) {
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isChatReady, setIsChatReady] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatId = useMemo(() => {
    if (!currentUser || !targetUser) return null;
    return [currentUser.id, targetUser.id].sort().join('_');
  }, [currentUser, targetUser]);

  const chatRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);

  // When the chat is opened, ensure the chat document exists before trying to fetch messages.
  useEffect(() => {
    if (!open) {
      setIsChatReady(false);
      return;
    }

    const ensureChatDocument = async () => {
        if (chatRef && currentUser && targetUser) {
            await setDoc(
                chatRef,
                { participantIds: [currentUser.id, targetUser.id] },
                { merge: true }
            );
            setIsChatReady(true);
        }
    };
    
    ensureChatDocument();

  }, [open, chatRef, currentUser, targetUser]);


  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId || !isChatReady) return null;
    return query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, chatId, isChatReady]);

  const { data: messages, isLoading } = useCollection<PrivateMessage>(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 100);
      }
    }
  }, [messages, open]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !chatId || !newMessage.trim() || !chatRef) return;

    // The chat document is created when the panel is opened, so we can just
    // add the message and update the `lastMessage` field.
    const messagesCollection = collection(chatRef, 'messages');

    // 1. Add the new message (non-blocking)
    const messageData = {
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      senderAvatarUrl: currentUser.avatarUrl,
      text: newMessage,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(messagesCollection, messageData);

    // 2. Update the last message on the chat document (non-blocking)
    updateDocumentNonBlocking(chatRef, {
      lastMessage: {
        text: newMessage,
        senderId: currentUser.id,
        createdAt: serverTimestamp(),
      },
    });

    setNewMessage('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col bg-slate-900 border-slate-700 p-0 w-full sm:max-w-md">
        <SheetHeader className="p-4 border-b border-slate-700">
          <SheetTitle className="text-cyan-400 font-headline flex items-center gap-3">
             <Avatar>
              <AvatarImage src={targetUser.avatarUrl} alt={targetUser.username} />
              <AvatarFallback>{targetUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            {targetUser.username}
          </SheetTitle>
           <SheetDescription>
            Chat privado. Los mensajes son en tiempo real.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          {isLoading && !isChatReady && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          )}
          <div className="space-y-4">
            {!isLoading && messages?.length === 0 && (
              <div className="text-center text-slate-500 py-16">
                <p>Aún no hay mensajes. ¡Sé el primero en saludar!</p>
              </div>
            )}
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.senderId === currentUser.id ? 'justify-end' : ''
                }`}
              >
                {msg.senderId !== currentUser.id && (
                  <Link href={`/profile/${msg.senderId}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.senderAvatarUrl} alt={msg.senderUsername} />
                      <AvatarFallback>
                        {msg.senderUsername.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div
                  className={`flex flex-col ${
                    msg.senderId === currentUser.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs md:max-w-sm ${
                      msg.senderId === currentUser.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm text-white">{msg.text}</p>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {msg.createdAt?.toDate
                      ? formatDistanceToNow(msg.createdAt.toDate(), {
                          addSuffix: true,
                          locale: es,
                        })
                      : 'enviando...'}
                  </span>
                </div>
                {msg.senderId === currentUser.id && (
                   <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
                      <AvatarFallback>
                        {currentUser.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t border-slate-700 bg-slate-900">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 w-full"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="bg-slate-800 border-slate-600 focus:ring-primary"
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
