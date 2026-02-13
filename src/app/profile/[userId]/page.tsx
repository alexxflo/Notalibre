import ProfilePageClient from '@/components/profile/ProfilePageClient';

export async function generateStaticParams() {
  // Since user profiles are dynamic and created at runtime,
  // we return an empty array. This tells Next.js not to pre-render
  // any specific profile pages at build time. They will be rendered
  // on the client-side when a user navigates to them.
  return [];
}

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const { userId } = params;
    return <ProfilePageClient userId={userId} />;
}
