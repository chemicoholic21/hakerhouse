import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import {
  getClientIdentifier,
  checkWriteRateLimit,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';
import { apiError, serverError } from '@/lib/api';

// GitHub rejects files larger than ~1 MB via the contents API; cap the README
// payload well within that so we fail fast with a clear message.
const MAX_README_BYTES = 900_000;

const updateReadmeSchema = z.object({
  readmeContent: z
    .string()
    .min(1, 'README content is required')
    .max(MAX_README_BYTES, 'README content is too large'),
  // Optional GitHub Personal Access Token. Empty string is treated as "absent".
  pat: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

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
    return apiError('Unauthorized', 401);
  }

  const { accessToken } = session;
  const githubUsername = session.user.githubUsername;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON body', 400);
    }

    const parsed = updateReadmeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
    }
    const { readmeContent, pat } = parsed.data;

    // Determine which token to use
    let authToUse = accessToken;

    // If a PAT is provided, validate it belongs to the authenticated user
    if (pat) {
      const validation = await validatePatOwnership(pat, githubUsername);
      if (!validation.valid) {
        return apiError(validation.error ?? 'Invalid PAT', 403);
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
        return serverError('getContent README.md', error);
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
    return serverError('update README', error);
  }
}
