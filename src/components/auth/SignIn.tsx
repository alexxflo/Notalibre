'use client';

import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const WELCOME_BONUS = 250;

export default function SignIn() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      toast({ title: 'Paso 1: Iniciando', description: 'Abriendo ventana de Google.', duration: 10000 });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      toast({ title: 'Paso 2: Autenticación Exitosa', description: `Usuario: ${user.displayName}`, duration: 10000 });

      // Check if user profile already exists
      const userDocRef = doc(firestore, 'users', user.uid);
      
      toast({ title: 'Paso 3: Verificando perfil...', description: 'Consultando la base de datos.', duration: 10000 });
      const docSnap = await getDoc(userDocRef);
      toast({ title: `Paso 4: Verificación completa.`, description: `¿El perfil ya existe?: ${docSnap.exists()}`, duration: 10000 });

      if (!docSnap.exists()) {
        toast({ title: 'Paso 5: Creando nuevo perfil', description: '¡Es tu primera vez, bienvenido!', duration: 10000 });
        // Create user profile document if it doesn't exist
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
        // Use non-blocking call. Error will be handled globally.
        setDocumentNonBlocking(userDocRef, newUserProfile, {});
        toast({ title: 'Paso 6: Perfil enviado para creación', description: `Recibirás ${WELCOME_BONUS} monedas.`, duration: 10000 });

        // Increment the global user counter
        const statsRef = doc(firestore, 'stats', 'users');
        setDoc(statsRef, { count: increment(1) }, { merge: true })
          .then(() => {
            toast({ title: 'Paso 7: Estadísticas actualizadas', duration: 10000 });
          })
          .catch(err => {
            const permissionError = new FirestorePermissionError({
              path: statsRef.path,
              operation: 'update',
              requestResourceData: { count: 'increment(1)' },
            });
            errorEmitter.emit('permission-error', permissionError);
          });
      } else {
          toast({ title: 'Paso 5: ¡Bienvenido de vuelta!', description: 'Cargando tu sesión.', duration: 10000 });
      }
    } catch (error) {
      const authError = error as AuthError;
      
      let title = 'Error de Autenticación';
      let description = authError.message || 'Ocurrió un error al intentar iniciar sesión.';

      if (authError.code === 'auth/unauthorized-domain') {
        title = 'Dominio no Autorizado';
        description = `El dominio de esta aplicación no ha sido autorizado. Ve a tu Consola de Firebase > Authentication > Settings > Authorized domains y añade el dominio.`;
      } else if (authError.code === 'auth/operation-not-allowed') {
        title = 'Error de Configuración';
        description = 'El inicio de sesión con Google no está habilitado. Por favor, actívalo en la consola de Firebase.';
      }

      toast({
        variant: 'destructive',
        title: `ERROR: ${title}`,
        description: `Detalle: ${description} (Código: ${authError.code})`,
        duration: 20000,
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
