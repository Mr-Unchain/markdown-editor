import {
  GitHubApiError,
  SecurityError,
  type GitHubFileResponse,
  type GitHubCommitResponse,
  type GitHubRateLimitResponse,
} from '$lib/types/platform'

/** GitHub API client interface for testability (M-U4-02) */
export interface GitHubApiClient {
  getFile(path: string, signal?: AbortSignal): Promise<GitHubFileResponse>
  createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string,
    signal?: AbortSignal,
  ): Promise<GitHubCommitResponse>
  getRateLimit(signal?: AbortSignal): Promise<GitHubRateLimitResponse>
  testAuth(signal?: AbortSignal): Promise<boolean>
}

/** Production implementation using fetch API (S-U4-03) */
export class GitHubApiClientImpl implements GitHubApiClient {
  constructor(
    private readonly token: string,
    private readonly owner: string,
    private readonly repo: string,
    private readonly branch: string,
  ) {}

  async getFile(path: string, signal?: AbortSignal): Promise<GitHubFileResponse> {
    return this.request<GitHubFileResponse>(
      `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
      { signal },
    )
  }

  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string,
    signal?: AbortSignal,
  ): Promise<GitHubCommitResponse> {
    const body: Record<string, string> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: this.branch,
    }
    if (sha) body.sha = sha

    return this.request<GitHubCommitResponse>(
      `/repos/${this.owner}/${this.repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
        signal,
      },
    )
  }

  async getRateLimit(signal?: AbortSignal): Promise<GitHubRateLimitResponse> {
    return this.request<GitHubRateLimitResponse>('/rate_limit', { signal })
  }

  async testAuth(signal?: AbortSignal): Promise<boolean> {
    try {
      await this.request<unknown>('/user', { signal })
      return true
    } catch {
      return false
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
    const url = `https://api.github.com${endpoint}`

    // HTTPS enforcement (NFR-U4-12)
    if (!url.startsWith('https://')) {
      throw new SecurityError('HTTPS以外の通信は許可されていません')
    }

    // Log without token (NFR-U4-13)
    console.debug(`[GitHubAPI] ${options?.method ?? 'GET'} ${endpoint}`)

    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) ?? {}),
      },
    })

    if (!response.ok) {
      // Log error without token (NFR-U4-13)
      console.error(`[GitHubAPI] ${response.status} ${response.statusText} for ${endpoint}`)

      const error = new GitHubApiError(response, endpoint)

      // Attach rate limit info if available
      const retryAfter = response.headers.get('Retry-After')
      if (retryAfter) {
        ;(error as { retryAfter: number }).retryAfter = parseInt(retryAfter, 10)
      }
      const rateLimitReset = response.headers.get('X-RateLimit-Reset')
      if (rateLimitReset) {
        ;(error as { rateLimitReset: number }).rateLimitReset = parseInt(rateLimitReset, 10)
      }

      throw error
    }

    return response.json() as Promise<T>
  }
}

/** Mock implementation for testing (M-U4-02) */
export class MockGitHubApiClient implements GitHubApiClient {
  private files = new Map<string, { content: string; sha: string }>()
  public callLog: Array<{ method: string; args: unknown[] }> = []

  async getFile(path: string): Promise<GitHubFileResponse> {
    this.callLog.push({ method: 'getFile', args: [path] })
    const file = this.files.get(path)
    if (!file) throw new GitHubApiError({ status: 404, statusText: 'Not Found' }, path)
    return {
      path,
      content: btoa(unescape(encodeURIComponent(file.content))),
      sha: file.sha,
      encoding: 'base64',
    }
  }

  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<GitHubCommitResponse> {
    this.callLog.push({ method: 'createOrUpdateFile', args: [path, content, message, sha] })

    // Simulate 409 conflict if sha doesn't match
    const existing = this.files.get(path)
    if (existing && sha && existing.sha !== sha) {
      throw new GitHubApiError({ status: 409, statusText: 'Conflict' }, path)
    }

    const newSha = crypto.randomUUID().replace(/-/g, '').slice(0, 40)
    this.files.set(path, { content, sha: newSha })
    return {
      content: { path, sha: newSha },
      commit: { message, sha: crypto.randomUUID().replace(/-/g, '').slice(0, 40) },
    }
  }

  async getRateLimit(): Promise<GitHubRateLimitResponse> {
    this.callLog.push({ method: 'getRateLimit', args: [] })
    return {
      resources: {
        core: { limit: 5000, remaining: 4999, reset: Math.floor(Date.now() / 1000) + 3600 },
      },
    }
  }

  async testAuth(): Promise<boolean> {
    this.callLog.push({ method: 'testAuth', args: [] })
    return true
  }

  /** Test helper: seed a file */
  seedFile(path: string, content: string, sha: string): void {
    this.files.set(path, { content, sha })
  }

  /** Test helper: get stored file */
  getStoredFile(path: string): { content: string; sha: string } | undefined {
    return this.files.get(path)
  }

  /** Test helper: reset state */
  reset(): void {
    this.files.clear()
    this.callLog = []
  }
}
