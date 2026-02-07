'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { InstagramIcon, TikTokIcon, FacebookIcon } from '../icons';

const MAX_DATA_URL_BYTES = 1024 * 1024; // 1 MiB (Firestore limit)

const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres.',
  }).max(30, {
      message: 'El nombre de usuario no puede tener más de 30 caracteres.',
  }),
  tiktokUrl: z.string().url({ message: 'URL de TikTok no válida.' }).or(z.literal('')),
  instagramUrl: z.string().url({ message: 'URL de Instagram no válida.' }).or(z.literal('')),
  facebookUrl: z.string().url({ message: 'URL de Facebook no válida.' }).or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
}

export function EditProfileDialog({ open, onOpenChange, userProfile }: EditProfileDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatarUrl);
  const [newAvatarDataUrl, setNewAvatarDataUrl] = useState<string | null>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: userProfile.username || '',
      tiktokUrl: userProfile.tiktokUrl || '',
      instagramUrl: userProfile.instagramUrl || '',
      facebookUrl: userProfile.facebookUrl || '',
    },
    mode: 'onChange',
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Archivo no válido', description: 'Por favor, selecciona una imagen.' });
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 512;
            const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
            canvas.width = img.width * scaleSize;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

            if (compressedDataUrl.length > MAX_DATA_URL_BYTES) {
                toast({ variant: 'destructive', title: 'Imagen demasiado grande', description: 'Incluso comprimida, la imagen es demasiado grande.' });
                return;
            }
            
            setAvatarPreview(compressedDataUrl);
            setNewAvatarDataUrl(compressedDataUrl);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  async function onSubmit(data: ProfileFormValues) {
    setIsSaving(true);
    
    const userDocRef = doc(firestore, 'users', userProfile.id);
    
    const updateData: Partial<UserProfile> = {
      username: data.username,
      tiktokUrl: data.tiktokUrl,
      instagramUrl: data.instagramUrl,
      facebookUrl: data.facebookUrl,
    };

    if (newAvatarDataUrl) {
      updateData.avatarUrl = newAvatarDataUrl;
    }
    
    try {
        updateDocumentNonBlocking(userDocRef, updateData);
        toast({ description: "Perfil actualizado correctamente." });
        onOpenChange(false);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el perfil.' });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Haz cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group w-32 h-32 cursor-pointer" onClick={handleAvatarClick}>
                 <Avatar className="w-32 h-32">
                    <AvatarImage src={avatarPreview || ''} alt={userProfile.username} />
                    <AvatarFallback>{userProfile.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white h-8 w-8" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif, image/webp"
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre de usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
                <FormField
                control={form.control}
                name="instagramUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><InstagramIcon className="w-4 h-4"/> Instagram</FormLabel>
                    <FormControl>
                        <Input placeholder="https://instagram.com/tu_usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="tiktokUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><TikTokIcon className="w-4 h-4"/> TikTok</FormLabel>
                    <FormControl>
                        <Input placeholder="https://tiktok.com/@tu_usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="facebookUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><FacebookIcon className="w-4 h-4"/> Facebook</FormLabel>
                    <FormControl>
                        <Input placeholder="https://facebook.com/tu_usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Cancelar
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
