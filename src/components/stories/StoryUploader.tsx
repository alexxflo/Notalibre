'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types';
import { Progress } from '@/components/ui/progress';

type StoryUploaderProps = {
    userProfile: UserProfile;
};

const MAX_DURATION = 50; // seconds

export default function StoryUploader({ userProfile }: StoryUploaderProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast({ variant: 'destructive', title: 'Archivo no válido', description: 'Por favor, selecciona un video.' });
            return;
        }

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            if (videoElement.duration > MAX_DURATION) {
                toast({ variant: 'destructive', title: 'Video demasiado largo', description: `La duración máxima es de ${MAX_DURATION} segundos.` });
                setDuration(videoElement.duration);
            } else {
                setDuration(videoElement.duration);
                setVideoFile(file);
                setVideoPreview(URL.createObjectURL(file));
            }
        };
        videoElement.src = URL.createObjectURL(file);
    };

    const handleUpload = async () => {
        if (!videoFile || !duration || duration > MAX_DURATION) {
            toast({ variant: 'destructive', title: 'No se puede subir', description: 'Por favor, selecciona un video válido.' });
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        try {
            // In a real app, you would upload the videoFile to Firebase Storage here
            // and get the download URL. We will simulate this process.
            const simulateUpload = new Promise<string>(resolve => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    setUploadProgress(progress);
                    if (progress >= 100) {
                        clearInterval(interval);
                        // Placeholder video URL
                        resolve('https://storage.googleapis.com/test-videos-studio/stories-placeholder.mp4');
                    }
                }, 200);
            });

            const videoUrl = await simulateUpload;

            const storiesCollection = collection(firestore, 'stories');
            const now = Timestamp.now();
            const expiresAt = new Timestamp(now.seconds + 24 * 60 * 60, now.nanoseconds);

            await addDoc(storiesCollection, {
                userId: userProfile.id,
                username: userProfile.username,
                avatarUrl: userProfile.avatarUrl,
                videoUrl: videoUrl,
                likes: [],
                comments: [],
                views: [],
                createdAt: now,
                expiresAt: expiresAt,
            });

            toast({ title: '¡Éxito!', description: 'Tu historia ha sido publicada.' });
            router.push('/stories');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = duration !== null && duration <= MAX_DURATION;

    return (
        <Card className="w-full max-w-lg mx-auto bg-card border-border">
            <CardHeader>
                <CardTitle>Subir Video</CardTitle>
                <CardDescription>Los videos deben durar 50 segundos o menos y se eliminarán después de 24 horas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                    className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {videoPreview ? (
                        <video src={videoPreview} className="w-full h-auto rounded-md" controls={false} />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Video className="h-12 w-12" />
                            <p>Arrastra un video aquí o haz clic para seleccionar</p>
                        </div>
                    )}
                     <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="video/*"
                        disabled={isLoading}
                    />
                </div>

                {duration !== null && (
                    <div className={`flex items-center gap-2 p-3 rounded-md ${isValid ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-red-400'}`}>
                        {isValid ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        <p className="font-medium">Duración: {duration.toFixed(1)}s / {MAX_DURATION}s</p>
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
                <Button onClick={handleUpload} disabled={isLoading || !isValid}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2" />}
                    Publicar Historia
                </Button>
            </CardFooter>
        </Card>
    );
}
