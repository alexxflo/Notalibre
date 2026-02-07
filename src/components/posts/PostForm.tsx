"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, increment } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';

type PostFormProps = {
    userProfile: UserProfile;
    onPostCreated?: () => void;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DATA_URL_BYTES = 1024 * 1024; // 1 MiB (Firestore limit)

export default function PostForm({ userProfile, onPostCreated }: PostFormProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [text, setText] = useState('');
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1280; // Resize to a reasonable width
                const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9); // Compress as JPEG

                if (compressedDataUrl.length > MAX_DATA_URL_BYTES) {
                    toast({ variant: 'destructive', title: 'Imagen demasiado grande', description: 'Incluso comprimida, la imagen es demasiado grande. Por favor, elige una con menor resolución.' });
                    setImageDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                }
                
                setImageDataUrl(compressedDataUrl);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handlePost = async () => {
        if (!text.trim() && !imageDataUrl) {
            toast({ variant: 'destructive', title: 'Publicación vacía', description: 'Escribe algo o sube una imagen para publicar.' });
            return;
        }

        setIsLoading(true);

        try {
            const postsCollection = collection(firestore, 'posts');
            await addDocumentNonBlocking(postsCollection, {
                userId: userProfile.id,
                username: userProfile.username,
                avatarUrl: userProfile.avatarUrl,
                text: text,
                imageUrl: imageDataUrl,
                likes: [],
                commentCount: 0,
                createdAt: serverTimestamp(),
                visibility: 'public',
            });

            setText('');
            setImageDataUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            toast({ title: "¡Éxito!", description: "Tu publicación ha sido compartida." });
            onPostCreated?.();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <Textarea
                    placeholder={`¿Qué estás pensando, ${userProfile.username}?`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-transparent border-0 focus-visible:ring-0 text-lg p-0"
                    rows={2}
                />
                {imageDataUrl && (
                    <div className="relative mt-4">
                        <Image
                            src={imageDataUrl}
                            alt="Image preview"
                            width={500}
                            height={300}
                            className="rounded-lg w-full h-auto object-contain"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            onClick={() => {
                                setImageDataUrl(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between p-2 border-t border-border">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary">
                    <ImageIcon />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                />
                <Button onClick={handlePost} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2"/>}
                    Publicar
                </Button>
            </CardFooter>
        </Card>
    );
}
