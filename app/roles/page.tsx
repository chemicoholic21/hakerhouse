import { Header } from '@/components/header';
import { RolesView } from '@/components/roles-view';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Roles',
  description: 'Find your next role in the open source ecosystem.',
  path: '/roles',
});

export const revalidate = false;

export default function RolesPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <RolesView />

      <footer className="border-t-2 border-dashed border-foreground/70 py-6">
        <div className="layout-container text-center text-sm">
          <p>
            © 2026 <span className="text-brand">hackerhou.se</span>. A home for{' '}
            <span className="text-highlight">human</span> programmers.
          </p>
        </div>
      </footer>
    </div>
  );
}
