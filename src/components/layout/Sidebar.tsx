'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Heart, PlusSquare, User, LayoutGrid, Rocket, LogOut, Gem } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { cn } from '@/lib/utils';
import VortexLogo from '@/components/VortexLogo';
import { Button, buttonVariants } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from '../auth/UserMenu';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import PostForm from '../posts/PostForm';
import { UserProfile } from '@/types';


const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href} passHref>
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start text-lg h-auto py-3 px-4",
                    isActive ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground hover:bg-accent/50 hover:text-white"
                )}
            >
                <Icon className="mr-4 h-7 w-7" />
                <span className="font-headline">{children}</span>
            </Button>
        </Link>
    );
};

const CreatePostButton = ({ userProfile }: { userProfile: UserProfile }) => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button
                    variant="ghost"
                    className="w-full justify-start text-lg h-auto py-3 px-4 text-muted-foreground hover:bg-accent/50 hover:text-white"
                >
                    <PlusSquare className="mr-4 h-7 w-7" />
                    <span className="font-headline">Crear</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-white font-headline">Crear nueva publicación</DialogTitle>
                </DialogHeader>
                <PostForm userProfile={userProfile} onPostCreated={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}


export default function Sidebar() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading || !user) {
        return (
            <div className="hidden md:block w-72 bg-card h-screen border-r border-border p-4">
                {/* Could show a skeleton loader here */}
            </div>
        );
    }
    
    // We can assume user is not null here because of the check above
    const userId = user.uid;

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col fixed top-0 left-0 w-72 bg-card h-screen border-r border-border p-4">
                <div className="py-4 px-2 mb-8">
                     <Link href="/">
                        <VortexLogo className="w-full h-auto" />
                    </Link>
                </div>
                <nav className="flex flex-col gap-2 flex-grow">
                    <NavLink href="/" icon={Home}>Inicio</NavLink>
                    <NavLink href="/messages" icon={MessageSquare}>Mensajes</NavLink>
                    <div className="relative">
                         <div
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                "w-full justify-start text-lg h-auto py-3 px-4 text-muted-foreground hover:bg-accent/50 hover:text-white"
                            )}
                        >
                            <Heart className="mr-4 h-7 w-7" />
                            <span className="font-headline flex-1 text-left">Notificaciones</span>
                            <NotificationBell />
                        </div>
                    </div>
                    <CreatePostButton userProfile={user as unknown as UserProfile} />
                    <NavLink href="/panel" icon={LayoutGrid}>Panel</NavLink>
                    <NavLink href={`/profile/${userId}`} icon={User}>Perfil</NavLink>
                </nav>
                 <div className="mt-auto">
                    <UserMenu />
                </div>
            </aside>
            
            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex justify-around items-stretch z-30">
                 <Link href="/" className="flex flex-col flex-1 items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-white"><Home/></Link>
                 <Link href="/messages" className="flex flex-col flex-1 items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-white"><MessageSquare/></Link>
                 <Dialog>
                    <DialogTrigger asChild>
                         <button className="flex flex-col flex-1 items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-white"><PlusSquare/></button>
                    </DialogTrigger>
                    <DialogContent>
                         <DialogHeader>
                            <DialogTitle>Crear nueva publicación</DialogTitle>
                        </DialogHeader>
                        <PostForm userProfile={user as unknown as UserProfile} />
                    </DialogContent>
                 </Dialog>
                 <Link href="/panel" className="flex flex-col flex-1 items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-white"><LayoutGrid/></Link>
                 <Link href={`/profile/${userId}`} className="flex flex-col flex-1 items-center justify-center text-muted-foreground hover:bg-accent/50 hover:text-white"><User/></Link>
            </div>

        </>

    );
}
