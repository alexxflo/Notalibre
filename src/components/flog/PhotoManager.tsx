"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { serverTimestamp, DocumentReference, increment } from 'firebase/firestore';
import { FlogProfile, UserProfile } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit, Save, Clock, ThumbsUp, ThumbsDown, Upload } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type PhotoManagerProps = {
  flogProfile: FlogProfile;
  flogProfileRef: DocumentReference<FlogProfile>;
  userProfile: UserProfile;
};

const COOLDOWN_HOURS = 24;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DATA_URL_BYTES = 1024 * 1024; // 1 MiB (Firestore limit)

export default function PhotoManager({ flogProfile, flogProfileRef, userProfile }: PhotoManagerProps) {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(flogProfile.description);
  
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const isOwner = user?.uid === flogProfile.userId;

  const canUpdatePhoto = () => {
    if (!flogProfile.lastPhotoUpdate) return true;
    const lastUpdate = flogProfile.lastPhotoUpdate.toDate();
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= COOLDOWN_HOURS;
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Archivo no válido', description: 'Por favor, selecciona una imagen.' });
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: `El tamaño máximo es ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
        return;
    }
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setNewPhotoPreview(previewUrl);

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

            if (compressedDataUrl.length > MAX_DATA_URL_BYTES) {
                toast({ variant: 'destructive', title: 'Imagen demasiado grande', description: 'Incluso comprimida, la imagen es demasiado grande para la base de datos. Por favor, elige una con menor resolución.' });
                setNewPhotoPreview(null);
                setNewPhotoDataUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                URL.revokeObjectURL(previewUrl);
                return;
            }
            
            setNewPhotoDataUrl(compressedDataUrl);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const handleSave = () => {
    const photoChanged = newPhotoDataUrl !== null;

    if (photoChanged && !canUpdatePhoto()) {
      toast({
        variant: "destructive",
        title: "Cooldown Activo",
        description: `Solo puedes cambiar tu foto principal una vez cada ${COOLDOWN_HOURS} horas.`,
      });
      return;
    }

    const dataToUpdate: any = { description };
    if (photoChanged && newPhotoDataUrl) {
      dataToUpdate.mainPhotoUrl = newPhotoDataUrl;
      dataToUpdate.lastPhotoUpdate = serverTimestamp();
    }
    
    // Use non-blocking update. Errors are handled by the global error handler.
    updateDocumentNonBlocking(flogProfileRef, dataToUpdate);

    toast({
      title: "¡Guardado!",
      description: "Tu Flog ha sido actualizado.",
    });
    
    setIsEditing(false);
    setNewPhotoDataUrl(null);
    setNewPhotoPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
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

  const handleCancelEdit = () => {
      setIsEditing(false);
      setDescription(flogProfile.description);
      setNewPhotoPreview(null);
      setNewPhotoDataUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }


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
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4 text-center">
        <div className="flex-1 flog-panel !p-2 !bg-black/20">
            <div className="text-2xl font-bold flog-theme-color">{flogProfile.followerCount ?? 0}</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Seguidores</div>
        </div>
        <div className="flex-1 flog-panel !p-2 !bg-black/20">
            <div className="text-2xl font-bold flog-theme-color">{userProfile.following?.length ?? 0}</div>
            <div className="text-xs uppercase tracking-widest text-slate-400">Siguiendo</div>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className='w-full flex justify-center items-center relative'>
            <Image
              src={newPhotoPreview || flogProfile.mainPhotoUrl || 'https://placehold.co/800x600'}
              alt="Main Flog Photo Preview"
              width={800}
              height={600}
              className="main-photo"
              unoptimized
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flog-button absolute bottom-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir Foto
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif, image/webp"
            />
          </div>
          
          <p className="text-xs text-yellow-500/80 mt-2 text-center">
            <b>Nota:</b> Para mantener la app rápida y dentro de los límites de la base de datos, tu foto se comprime antes de subirla. Se intenta preservar la mayor calidad posible sin superar el límite de 1MB.
          </p>
           {!canUpdatePhoto() && (
                <p className="text-xs text-yellow-500 mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> No puedes cambiar la foto aún.</p>
            )}

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
            <Button onClick={handleCancelEdit} variant="ghost" className="text-slate-400 hover:text-white">
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
