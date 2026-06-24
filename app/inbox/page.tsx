import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Inbox',
  description: 'Your messages on Kerhouse.',
  path: '/inbox',
});

export default function InboxPage() {
  redirect('/');
}
