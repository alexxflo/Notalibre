'use client';

import { useAuth, useFirestore } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  type AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '../icons';
import { useToast } from '@/hooks/use-toast';
import VortexLogo from '../VortexLogo';

const WELCOME_BONUS = 50;

export default function SignIn() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile already exists
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Create user profile document if it doesn't exist
        const newUserProfile = {
          username: user.displayName || 'Usuario Anónimo',
          email: user.email || '',
          avatarUrl: user.photoURL || `https://unavatar.io/${user.email}`,
          coinBalance: WELCOME_BONUS,
          gatekeeperPassed: false,
        };
        // We use setDoc here because it's a one-time critical creation.
        // For subsequent updates, we should use non-blocking updates.
        await setDoc(userDocRef, newUserProfile);
      }
    } catch (error) {
      const authError = error as AuthError;

      if (authError.code === 'auth/operation-not-allowed') {
        toast({
          variant: 'destructive',
          title: 'Error de Configuración',
          description:
            'El inicio de sesión con Google no está habilitado. Por favor, actívalo en la consola de Firebase.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de Autenticación',
          description:
            authError.message || 'Ocurrió un error al intentar iniciar sesión.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="text-center mb-8">
        <VortexLogo className="w-64 h-auto" />
        <p className="text-xl text-slate-400 mt-4">
          Acelera tu Crecimiento Social.
        </p>
      </div>
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-headline font-bold text-white mb-2">
          Acceso a la Plataforma
        </h2>
        <p className="text-slate-400 mb-6">
          Inicia sesión para dominar el algoritmo.
        </p>
        <Button
          onClick={handleGoogleSignIn}
          size="lg"
          className="w-full font-bold bg-white text-black hover:bg-gray-200"
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          Iniciar Sesión con Google
        </Button>
      </div>
    </div>
  );
}
