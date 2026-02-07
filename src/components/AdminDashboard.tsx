"use client";

import { useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { UserProfile, DailyStats } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Ban, ShieldAlert, Users, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_UID = 'cgjnVXgaoVWFJfSwu4r1UAbZHbf1';

export default function AdminDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [coinInputs, setCoinInputs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!user || user.uid !== ADMIN_UID) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const dailyStatsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'stats', 'daily_active');
  }, [firestore]);

  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: dailyStats, isLoading: isDailyStatsLoading } = useDoc<DailyStats>(dailyStatsRef);
  
  const today = new Date().toISOString().split('T')[0];
  const dailyActiveUsers = dailyStats?.date === today ? dailyStats.count : 0;

  const handleCoinChange = (userId: string, value: string) => {
    setCoinInputs(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveCoins = (userId: string) => {
    const newBalance = parseInt(coinInputs[userId], 10);
    if (isNaN(newBalance) || newBalance < 0) {
      toast({
        variant: "destructive",
        title: "Valor Inválido",
        description: "Por favor, introduce un número de monedas válido.",
      });
      return;
    }
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { coinBalance: newBalance });
    toast({
      title: "Éxito",
      description: "Saldo de monedas actualizado.",
    });
    setCoinInputs(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
    });
  };

  const handleToggleBlock = (userId: string, isCurrentlyBlocked: boolean | undefined) => {
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { isBlocked: !isCurrentlyBlocked });
    toast({
      title: "Éxito",
      description: `Usuario ${!isCurrentlyBlocked ? 'bloqueado' : 'desbloqueado'}.`,
    });
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.username.toLowerCase().includes(filter.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [users, filter]);

  if (areUsersLoading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="h-12 w-12 animate-spin text-cyan-400" /></div>;
  }

  if (user?.uid !== ADMIN_UID) {
      return <div className="text-center text-red-500 py-16"><ShieldAlert className="mx-auto h-12 w-12" /><p className="mt-4 font-bold text-lg">Acceso Denegado</p><p>No tienes permiso para ver esta página.</p></div>
  }

  return (
    <div className="w-full max-w-7xl flex flex-col gap-6 p-2 md:p-6 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-red-500/20">
      <h2 className="text-3xl font-bold font-headline text-red-400">Panel de Administrador</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Usuarios Activos Hoy</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
                {isDailyStatsLoading ? (
                    <Skeleton className="h-8 w-1/4 bg-slate-700" />
                ) : (
                    <div className="text-2xl font-bold text-white">{dailyActiveUsers.toLocaleString()}</div>
                )}
                <p className="text-xs text-slate-400">Usuarios únicos que han entrado hoy. (No es en tiempo real)</p>
            </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Usuarios Registrados</CardTitle>
                <UserPlus className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
                {areUsersLoading ? (
                    <Skeleton className="h-8 w-1/4 bg-slate-700" />
                ) : (
                    <div className="text-2xl font-bold text-white">{(users?.length ?? 0).toLocaleString()}</div>
                )}
                <p className="text-xs text-slate-400">Total de cuentas creadas en la plataforma.</p>
            </CardContent>
        </Card>
      </div>


      <Input
        placeholder="Filtrar por nombre o email..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm bg-slate-900 border-slate-700"
      />
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-slate-800">
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Monedas</TableHead>
              <TableHead className="w-[300px]">Modificar Monedas</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(u => (
              <TableRow key={u.id} className={`${u.isBlocked ? 'bg-red-900/30' : ''} hover:bg-slate-800 border-b border-slate-800`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={u.avatarUrl} alt={u.username} />
                      <AvatarFallback>{u.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-white">{u.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{u.email}</TableCell>
                <TableCell className="text-right font-mono text-cyan-400">{u.coinBalance}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={coinInputs[u.id] ?? ''}
                      onChange={(e) => handleCoinChange(u.id, e.target.value)}
                      placeholder="Nuevo saldo"
                      className="bg-slate-800 border-slate-600 h-9"
                    />
                    <Button size="sm" onClick={() => handleSaveCoins(u.id)} disabled={coinInputs[u.id] === undefined}>Guardar</Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant={u.isBlocked ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
