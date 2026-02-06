'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User, Heart, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function NotificationItem({ notification }: { notification: Notification }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'new_follower':
        return <User className="h-4 w-4 text-cyan-400" />;
      case 'new_like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'new_comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'avatar_change':
        return <ImageIcon className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getText = () => {
    switch (notification.type) {
      case 'new_follower':
        return (
          <>
            <span className="font-bold">{notification.actorUsername}</span> te ha
            seguido.
          </>
        );
      case 'new_like':
        return (
          <>
            <span className="font-bold">{notification.actorUsername}</span> le
            ha gustado tu publicación:{' '}
            <span className="italic">"{notification.postTextSnippet}..."</span>
          </>
        );
      case 'new_comment':
        return (
          <>
            <span className="font-bold">{notification.actorUsername}</span> ha
            comentado en tu publicación:{' '}
            <span className="italic">"{notification.postTextSnippet}..."</span>
          </>
        );
      case 'avatar_change':
        return (
          <>
            <span className="font-bold">{notification.actorUsername}</span> ha
            cambiado su foto de perfil.
          </>
        );
      default:
        return 'Nueva notificación.';
    }
  };

  const link = `/profile/${notification.actorId}`;

  return (
    <DropdownMenuItem
      asChild
      className={`cursor-pointer focus:bg-slate-800 ${
        !notification.read ? 'bg-primary/10' : ''
      }`}
    >
      <Link href={link} className="flex items-start gap-3 p-2">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-grow">
          <p className="text-sm text-slate-300">{getText()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {notification.createdAt?.toDate
              ? formatDistanceToNow(notification.createdAt.toDate(), {
                  addSuffix: true,
                  locale: es,
                })
              : ''}
          </p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={notification.actorAvatarUrl}
            alt={notification.actorUsername}
          />
          <AvatarFallback>
            {notification.actorUsername.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>
    </DropdownMenuItem>
  );
}


export default function NotificationBell() {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('createdAt', 'desc'), limit(15));
    }, [firestore, user]);

    const { data: notifications } = useCollection<Notification>(notificationsQuery);
    
    const hasUnread = notifications?.some(n => !n.read);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen || !notifications || !user) return;
        
        // Mark all visible unread notifications as read
        for (const n of notifications) {
            if (!n.read) {
                const notifRef = doc(firestore, 'users', user.uid, 'notifications', n.id);
                updateDocumentNonBlocking(notifRef, { read: true });
            }
        }
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-300 hover:bg-slate-800/50 hover:text-white">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96 bg-slate-900 border-slate-700 text-white" align="end">
                <DropdownMenuLabel className="font-headline">Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                {notifications && notifications.length > 0 ? (
                    notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                ) : (
                    <p className="p-4 text-center text-sm text-slate-500">No tienes notificaciones.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

    