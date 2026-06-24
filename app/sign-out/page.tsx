import { SignOutView } from '@/components/sign-out-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sign Out',
  description: 'Sign out of Kerhouse.',
  path: '/sign-out',
});

export const revalidate = false;

export default function SignOutPage() {
  return <SignOutView />;
}
