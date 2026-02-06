'use client';

import { useAuth, useFirestore } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  type AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '../icons';
import { useToast } from '@/hooks/use-toast';
import VortexLogo from '../VortexLogo';

const WELCOME_BONUS = 250;

export default function SignIn() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const newUserProfile = {
          username: user.displayName || 'Usuario Anónimo',
          email: user.email || '',
          avatarUrl: user.photoURL || `https://unavatar.io/${user.email}`,
          coinBalance: WELCOME_BONUS,
          gatekeeperPassed: false,
          isBlocked: false,
          following: [],
          followers: [],
        };
        
        // Using await for a synchronous, predictable flow.
        await setDoc(userDocRef, newUserProfile);

        const statsRef = doc(firestore, 'stats', 'users');
        // Also awaiting this to ensure it completes or fails within the try block.
        await setDoc(statsRef, { count: increment(1) }, { merge: true });
        
        toast({
          title: '¡Bienvenido a VORTEX!',
          description: `Hemos creado tu perfil y te hemos dado ${WELCOME_BONUS} monedas de bienvenida.`,
        });

      } else {
        const userData = docSnap.data();
        toast({
          title: `¡Bienvenido de vuelta, ${userData?.username || 'Usuario'}!`,
          description: 'Cargando tu sesión...',
        });
      }
    } catch (error: any) {
      console.error("Sign-in failed:", error); // Log the full error for my debugging.

      let title = 'Error Inesperado';
      let description = error.message || 'Ocurrió un error al intentar iniciar sesión.';

      // Check for a specific error code to provide better user feedback.
      if (error.code) {
        switch(error.code) {
          case 'auth/popup-closed-by-user':
            // Don't show an error toast if the user intentionally closes the popup.
            return;
          case 'auth/unauthorized-domain':
            title = 'Dominio no Autorizado';
            description = `El dominio de esta aplicación no ha sido autorizado en Firebase. Por favor, añádelo en la Consola de Firebase > Authentication > Settings > Authorized domains.`;
            break;
          case 'auth/operation-not-allowed':
            title = 'Error de Configuración';
            description = 'El inicio de sesión con Google no está habilitado. Por favor, actívalo en la consola de Firebase.';
            break;
          case 'permission-denied': // This will catch Firestore security rule errors
            title = 'Error de Permisos';
            description = 'No se pudo crear tu perfil de usuario. Revisa las reglas de seguridad de Firestore. (Error: permission-denied)';
            break;
          default:
            // For any other coded error, display the code.
            description = `${error.message} (código: ${error.code})`;
        }
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 15000,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="text-center mb-8">
        <VortexLogo className="relative w-80 h-32" />
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
