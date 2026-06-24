import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import {
  getClientIdentifier,
  checkWriteRateLimit,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

/**
 * Validate that a PAT belongs to the authenticated user
 * by checking if the token's authenticated user matches the session username
 */
async function validatePatOwnership(
  pat: string,
  expectedUsername: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const octokit = new Octokit({ auth: pat });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    if (user.login.toLowerCase() !== expectedUsername.toLowerCase()) {
      return {
        valid: false,
        error: 'The provided PAT does not belong to the authenticated user',
      };
    }

    return { valid: true };
  } catch (error: unknown) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number }).status
        : undefined;
    if (status === 401) {
      return { valid: false, error: 'Invalid or expired PAT' };
    }
    return { valid: false, error: 'Failed to validate PAT' };
  }
}

export async function POST(req: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkWriteRateLimit(clientId);

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const session = await auth();

  if (!session || !session.accessToken || !session.user?.githubUsername) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { accessToken } = session;
  const githubUsername = session.user.githubUsername;

  try {
    const { readmeContent, pat } = await req.json();

    if (!readmeContent) {
      return NextResponse.json({ message: 'README content is required' }, { status: 400 });
    }

    // Determine which token to use
    let authToUse = accessToken;

    // If a PAT is provided, validate it belongs to the authenticated user
    if (pat) {
      const validation = await validatePatOwnership(pat, githubUsername);
      if (!validation.valid) {
        return NextResponse.json({ message: validation.error }, { status: 403 });
      }
      authToUse = pat;
    }

    const octokit = new Octokit({ auth: authToUse });

    const repoName = githubUsername; // GitHub special repository is username/username
    const filePath = 'README.md';
    const commitMessage = 'Update GitHub Profile README from hackerhou.se';
    const content = Buffer.from(readmeContent).toString('base64');

    let sha: string | undefined;

    try {
      // Try to get the existing README.md to retrieve its SHA
      const { data } = await octokit.rest.repos.getContent({
        owner: githubUsername,
        repo: repoName,
        path: filePath,
      });

      if (data && !Array.isArray(data) && 'sha' in data) {
        sha = data.sha;
      }
    } catch (error: unknown) {
      // If the file doesn't exist, GitHub API will return a 404 error
      const isNotFound =
        error && typeof error === 'object' && 'status' in error && error.status === 404;
      if (!isNotFound) {
        console.error('Error getting README.md:', error);
        return NextResponse.json({ message: 'Error accessing repository' }, { status: 500 });
      }
    }

    if (sha) {
      // Update existing file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: githubUsername,
        repo: repoName,
        path: filePath,
        message: commitMessage,
        content: content,
        sha: sha,
      });
    } else {
      // Create new file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: githubUsername,
        repo: repoName,
        path: filePath,
        message: commitMessage,
        content: content,
      });
    }

    return NextResponse.json({ message: 'README updated successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating README:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Error updating README', error: errorMessage },
      { status: 500 }
    );
  }
}
