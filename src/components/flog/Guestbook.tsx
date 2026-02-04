"use client";

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FlogProfile, FlogSignature, UserProfile } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type GuestbookProps = {
  userProfile: UserProfile;
  flogProfile: FlogProfile;
};

const SIGNATURES_LIMIT = 50;

export default function Guestbook({ userProfile, flogProfile }: GuestbookProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newSignature, setNewSignature] = useState('');

  const signaturesQuery = useMemoFirebase(() => {
    if (!firestore || !flogProfile) return null;
    return query(
      collection(firestore, 'flogs', flogProfile.userId, 'signatures'),
      orderBy('createdAt', 'desc'),
      limit(SIGNATURES_LIMIT)
    );
  }, [firestore, flogProfile]);

  const { data: signatures, isLoading } = useCollection<FlogSignature>(signaturesQuery);

  const handleAddSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !newSignature.trim() || !flogProfile) return;

    const signaturesCollection = collection(firestore, 'flogs', flogProfile.userId, 'signatures');
    addDocumentNonBlocking(signaturesCollection, {
      authorId: user.uid,
      authorUsername: userProfile.username,
      authorAvatar: userProfile.avatarUrl,
      text: newSignature,
      createdAt: serverTimestamp(),
    });

    setNewSignature('');
    toast({
      title: "¡Firma enviada!",
      description: "Has dejado tu marca en este Flog.",
    });
  };

  return (
    <div className="flog-panel flog-theme-border">
      <h2 className="flog-panel-title flog-theme-text-shadow mb-2">Libro de Firmas</h2>
      <p className="text-xs text-slate-400 mb-4 uppercase tracking-widest">{signatures?.length ?? 0} firmas de 20 permitidas</p>

      <form onSubmit={handleAddSignature} className="mb-6 space-y-2">
        <Textarea
          placeholder="¡Deja tu firma!"
          value={newSignature}
          onChange={(e) => setNewSignature(e.target.value)}
          className="flog-textarea flog-theme-outline"
          rows={3}
        />
        <Button type="submit" disabled={!newSignature.trim()} className="flog-button">
          <Send className="w-4 h-4 mr-2" />
          Firmar
        </Button>
      </form>

      <div className="space-y-3">
        {isLoading && <Loader2 className="animate-spin mx-auto text-cyan-400" />}
        {signatures && signatures.length > 0 ? (
          signatures.map((sig) => (
            <div key={sig.id} className="guestbook-entry flex items-start gap-3">
              <Avatar className="h-10 w-10 border-2 flog-theme-border">
                <AvatarImage src={sig.authorAvatar} />
                <AvatarFallback>{sig.authorUsername.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-bold flog-theme-color">{sig.authorUsername}</p>
                  <span className="text-xs text-slate-500">
                    {sig.createdAt ? formatDistanceToNow(sig.createdAt.toDate(), { addSuffix: true, locale: es }) : 'hace un momento'}
                  </span>
                </div>
                <p className="text-sm text-slate-200">{sig.text}</p>
              </div>
            </div>
          ))
        ) : (
          !isLoading && <p className="text-slate-500 text-center py-4">Aún no hay firmas. ¡Sé el primero!</p>
        )}
      </div>
    </div>
  );
}
