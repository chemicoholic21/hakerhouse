import { SignInForm } from '@/components/auth-signin-form';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sign In',
  description: 'Sign in to Kerhouse to join the community.',
  path: '/sign-in',
});

export const revalidate = false;

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100-200px)] flex items-center justify-center py-12">
      <SignInForm />
    </div>
  );
}
