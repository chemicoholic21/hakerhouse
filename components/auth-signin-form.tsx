import { GithubSignInButton } from './auth-github-button';

export function SignInForm() {
  return (
    <div className="max-w-md w-full mx-auto border-2 border-dashed border-foreground/70 p-8 my-12">
      <h1 className="text-2xl font-bold mb-8 text-highlight text-center uppercase tracking-widest">
        Authentication
      </h1>

      <div className="space-y-6">
        <GithubSignInButton />
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed">
        By continuing, you agree to build cool stuff and respect the human programmers.
      </p>
    </div>
  );
}
