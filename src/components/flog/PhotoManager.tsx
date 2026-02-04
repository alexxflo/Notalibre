"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useFirestore, useUser } from '@/firebase';
import { updateDoc, serverTimestamp, DocumentReference, increment } from 'firebase/firestore';
import { FlogProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit, Save, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type PhotoManagerProps = {
  flogProfile: FlogProfile;
  flogProfileRef: DocumentReference<FlogProfile>;
};

const COOLDOWN_HOURS = 24;

export default function PhotoManager({ flogProfile, flogProfileRef }: PhotoManagerProps) {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(flogProfile.description);
  const [photoUrl, setPhotoUrl] = useState(flogProfile.mainPhotoUrl);
  const { toast } = useToast();

  const isOwner = user?.uid === flogProfile.userId;

  const canUpdatePhoto = () => {
    if (!flogProfile.lastPhotoUpdate) return true;
    const lastUpdate = flogProfile.lastPhotoUpdate.toDate();
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= COOLDOWN_HOURS;
  };

  const handleSave = async () => {
    const photoChanged = photoUrl !== flogProfile.mainPhotoUrl;

    if (photoChanged && !canUpdatePhoto()) {
      toast({
        variant: "destructive",
        title: "Cooldown Activo",
        description: `Solo puedes cambiar tu foto principal una vez cada ${COOLDOWN_HOURS} horas.`,
      });
      setPhotoUrl(flogProfile.mainPhotoUrl); // Revert URL
      return;
    }

    try {
      const dataToUpdate: any = {
        description,
      };

      if (photoChanged) {
        dataToUpdate.mainPhotoUrl = photoUrl;
        dataToUpdate.lastPhotoUpdate = serverTimestamp();
      }

      await updateDoc(flogProfileRef, dataToUpdate);

      toast({
        title: "¡Guardado!",
        description: "Tu Flog ha sido actualizado.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating Flog profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar tu perfil. Revisa las reglas de seguridad o intenta de nuevo.",
      });
    }
  };

  const handleLike = () => {
    if (isOwner) {
        toast({ variant: 'destructive', title: 'No puedes votar tu propia foto.' });
        return;
    }
    updateDocumentNonBlocking(flogProfileRef, { likes: increment(1) });
    toast({ title: '¡Gracias por tu voto!' });
  };

  const handleDislike = () => {
    if (isOwner) {
        toast({ variant: 'destructive', title: 'No puedes votar tu propia foto.' });
        return;
    }
    updateDocumentNonBlocking(flogProfileRef, { dislikes: increment(1) });
    toast({ title: '¡Gracias por tu voto!' });
  };


  return (
    <div className="flog-panel flog-theme-border flog-theme-shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="flog-panel-title flog-theme-text-shadow">Mi Foto</h2>
        {isOwner && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="flog-button">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase flog-theme-color">URL de la Foto</label>
            <Input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="flog-input flog-theme-outline"
              placeholder="https://i.imgur.com/..."
            />
            <p className="text-xs text-yellow-500/80 mt-2">
                <b>Nota:</b> La subida directa de archivos requiere Firebase Storage. Por ahora, sube tu imagen a un servicio como <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline">Imgur</a> y pega la URL aquí.
            </p>
            {!canUpdatePhoto() && (
                <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> No puedes cambiar la foto aún.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase flog-theme-color">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flog-textarea flog-theme-outline"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flog-button">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="ghost" className="text-slate-400 hover:text-white">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full flex justify-center items-center">
            <Image
              src={flogProfile.mainPhotoUrl || 'https://placehold.co/800x600'}
              alt="Main Flog Photo"
              width={800}
              height={600}
              className="main-photo"
              unoptimized
            />
          </div>
          <div className="description-box">
            <p>{flogProfile.description}</p>
          </div>
          <div className="flex justify-center items-center gap-4 pt-2">
              <Button onClick={handleLike} className="flog-button" disabled={isOwner}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  ({flogProfile.likes ?? 0})
              </Button>
              <Button onClick={handleDislike} className="flog-button" disabled={isOwner}>
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  ({flogProfile.dislikes ?? 0})
              </Button>
          </div>
        </div>
      )}
    </div>
  );
}
