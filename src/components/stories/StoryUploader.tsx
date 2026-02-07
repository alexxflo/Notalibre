'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, Video, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';
import { Progress } from '@/components/ui/progress';

type StoryUploaderProps = {
    userProfile: UserProfile;
};

const MAX_VIDEO_DURATION = 15; // seconds
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB for videos
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB for images


export default function StoryUploader({ userProfile }: StoryUploaderProps) {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const router = useRouter();

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setDuration(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            resetState();
            return;
        }

        if (file.type.startsWith('video/')) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast({ variant: 'destructive', title: 'Video demasiado pesado', description: `El tamaño máximo es ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` });
                resetState();
                return;
            }

            setMediaType('video');
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.onloadedmetadata = () => {
                window.URL.revokeObjectURL(videoElement.src);
                setMediaPreview(URL.createObjectURL(file));
                setDuration(videoElement.duration);
                
                if (videoElement.duration > MAX_VIDEO_DURATION) {
                    toast({ variant: 'destructive', title: 'Video demasiado largo', description: `La duración máxima es de ${MAX_VIDEO_DURATION} segundos.` });
                    setMediaFile(null); // Invalidate the file
                } else {
                    setMediaFile(file); // Validate the file
                }
            };
            videoElement.src = URL.createObjectURL(file);
        } else if (file.type.startsWith('image/')) {
             if (file.size > MAX_IMAGE_SIZE_BYTES) {
                toast({ variant: 'destructive', title: 'Imagen demasiado pesada', description: `El tamaño máximo es ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.` });
                resetState();
                return;
            }
            
            setMediaType('image');
            setDuration(null); // Not applicable for images
            
            // Image compression logic from PostForm
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1080; // Resize to a reasonable width
                    const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
                    canvas.width = img.width * scaleSize;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Compress as JPEG for smaller size
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

                    setMediaPreview(compressedDataUrl);

                    // Create a new File object from the compressed data URL
                    fetch(compressedDataUrl)
                        .then(res => res.blob())
                        .then(blob => {
                            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                            setMediaFile(compressedFile);
                        });
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else {
            toast({ variant: 'destructive', title: 'Archivo no válido', description: 'Por favor, selecciona un video o una imagen.' });
            resetState();
        }
    };

    const handleUpload = async () => {
        if (!mediaFile || !mediaType) {
            toast({ variant: 'destructive', title: 'No se puede subir', description: 'Por favor, selecciona un archivo válido.' });
            return;
        }
        if (mediaType === 'video' && (!duration || duration > MAX_VIDEO_DURATION)) {
            toast({ variant: 'destructive', title: 'Video no válido', description: `El video debe durar ${MAX_VIDEO_DURATION} segundos o menos.` });
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        const storageRef = ref(storage, `stories/${userProfile.id}/${Date.now()}-${mediaFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, mediaFile);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                toast({ variant: 'destructive', title: 'Error de Subida', description: 'No se pudo subir el archivo. Inténtalo de nuevo.'});
                setIsLoading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                    try {
                        const storiesCollection = collection(firestore, 'stories');
                        const now = Timestamp.now();
                        const expiresAt = new Timestamp(now.seconds + 24 * 60 * 60, now.nanoseconds);

                        await addDoc(storiesCollection, {
                            userId: userProfile.id,
                            username: userProfile.username,
                            avatarUrl: userProfile.avatarUrl,
                            mediaUrl: downloadURL,
                            mediaType: mediaType,
                            likes: [],
                            comments: [],
                            views: [],
                            createdAt: now,
                            expiresAt: expiresAt,
                        });

                        toast({ title: '¡Éxito!', description: 'Tu historia ha sido publicada.' });
                        router.push('/stories');

                    } catch (error: any) {
                        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la historia en la base de datos.' });
                    } finally {
                        setIsLoading(false);
                    }
                }).catch((error) => {
                    console.error("Get Download URL error:", error);
                    toast({ variant: 'destructive', title: 'Error de Procesamiento', description: 'No se pudo obtener la URL del archivo subido.'});
                    setIsLoading(false);
                });
            }
        );
    };

    const isValid = mediaType === 'image' || (mediaType === 'video' && duration !== null && duration <= MAX_VIDEO_DURATION);

    return (
        <Card className="w-full max-w-lg mx-auto bg-card border-border">
            <CardHeader>
                <CardTitle>Subir Historia</CardTitle>
                <CardDescription>Sube un video (máx. {MAX_VIDEO_DURATION}s) o una imagen. Se eliminará después de 24 horas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                    className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent aspect-video flex items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {mediaPreview ? (
                        mediaType === 'video' ? (
                            <video src={mediaPreview} className="absolute inset-0 w-full h-full object-contain rounded-md" controls={false} muted autoPlay loop/>
                        ) : (
                            <img src={mediaPreview} alt="Previsualización" className="absolute inset-0 w-full h-full object-contain rounded-md" />
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <UploadCloud className="h-12 w-12" />
                            <p>Arrastra un archivo aquí o haz clic para seleccionar</p>
                            <p className="text-xs">(Video o Imagen)</p>
                        </div>
                    )}
                     <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="video/*,image/*"
                        disabled={isLoading}
                    />
                </div>

                {mediaType === 'video' && duration !== null && (
                    <div className={`flex items-center gap-2 p-3 rounded-md ${isValid ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-red-400'}`}>
                        {isValid ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        <p className="font-medium">Duración: {duration.toFixed(1)}s / {MAX_VIDEO_DURATION}s</p>
                    </div>
                )}

                 {mediaType === 'image' && mediaFile && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/20 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-medium">Imagen seleccionada: { (mediaFile.size / 1024 / 1024).toFixed(2) } MB</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="space-y-2">
                        <p className="text-sm text-center text-primary">Subiendo...</p>
                        <Progress value={uploadProgress} className="w-full" />
                    </div>
                )}

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => router.back()}>Cancelar</Button>
                <Button onClick={handleUpload} disabled={isLoading || !mediaFile || !isValid}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2" />}
                    Publicar Historia
                </Button>
            </CardFooter>
        </Card>
    );
}
