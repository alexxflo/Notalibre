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
      // This check is important as useAuth() and useFirestore() can return null initially
      if (!auth || !firestore) {
        toast({
          variant: "destructive",
          title: "Error de Inicialización",
          description: "Los servicios de Firebase no están disponibles. Por favor, refresca la página e inténtalo de nuevo.",
        });
        return;
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // After successful authentication, check for user profile
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      // If the user profile doesn't exist, create it
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
        
        // Await the profile creation to ensure it completes before proceeding
        // or fails within this try...catch block.
        await setDoc(userDocRef, newUserProfile);
        
        // NOTE: The logic to update the global user count has been removed from this critical path
        // to minimize potential points of failure during the initial sign-in.
        
        toast({
          title: '¡Bienvenido a VORTEX!',
          description: `Hemos creado tu perfil y te hemos dado ${WELCOME_BONUS} monedas de bienvenida.`,
        });

      } else {
        // If the profile already exists, just welcome them back
        const userData = docSnap.data();
        toast({
          title: `¡Bienvenido de vuelta, ${userData?.username || 'Usuario'}!`,
          description: 'Cargando tu sesión...',
        });
      }
    } catch (error: any) {
      // Log the full error for debugging in the development console
      console.error("Sign-in failed:", error);

      // Default error messages
      let title = 'Error Inesperado';
      let description = error.message || 'Ocurrió un error al intentar iniciar sesión.';

      // Provide more specific feedback based on the error code
      if (error.code) {
        switch(error.code) {
          case 'auth/popup-closed-by-user':
            // This is a user action, not an error. Don't show a toast.
            return;
          case 'auth/unauthorized-domain':
            title = 'Dominio no Autorizado';
            description = `El dominio de esta aplicación no ha sido autorizado en Firebase. Por favor, añádelo en la Consola de Firebase > Authentication > Settings > Authorized domains.`;
            break;
          case 'auth/operation-not-allowed':
            title = 'Error de Configuración';
            description = 'El inicio de sesión con Google no está habilitado. Por favor, actívalo en la consola de Firebase.';
            break;
          case 'permission-denied': // This will catch Firestore security rule errors during setDoc/getDoc
            title = 'Error de Permisos';
            description = 'No se pudo leer o escribir tu perfil de usuario. Por favor, revisa las reglas de seguridad de Firestore. (Error: permission-denied)';
            break;
          default:
            // For any other Firebase-specific error, show the code
            description = `${error.message} (código: ${error.code})`;
        }
      }

      // Display the final error toast
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
