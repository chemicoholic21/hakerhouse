import { redirect } from 'next/navigation';
import { developers } from '@/lib/data';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Profile',
  description: 'View user profile on Kerhouse.',
  path: '/profile',
});

/** Old path; profiles live at /{username} */
export default function LegacyProfileRedirect() {
  const first = developers[0];
  if (!first) redirect('/');
  redirect(`/${first.username}`);
}
