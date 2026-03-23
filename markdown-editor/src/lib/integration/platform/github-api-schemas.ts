import { z } from 'zod'

/** GitHub Contents API — file response schema */
export const GitHubFileResponseSchema = z.object({
  path: z.string(),
  content: z.string(),
  sha: z.string(),
  encoding: z.literal('base64').optional(),
})

/** GitHub Contents API — commit response schema */
export const GitHubCommitResponseSchema = z.object({
  content: z.object({
    path: z.string(),
    sha: z.string(),
  }),
  commit: z.object({
    message: z.string(),
    sha: z.string(),
  }),
})

/** GitHub Rate Limit API response schema */
export const GitHubRateLimitResponseSchema = z.object({
  resources: z.object({
    core: z.object({
      limit: z.number(),
      remaining: z.number(),
      reset: z.number(),
    }),
  }),
})
