/**
 * Server-side configuration. Values come from environment variables so the
 * same build can run locally and on Vercel.
 *
 * Required:
 *   ANTHROPIC_API_KEY  - key for the Claude API (read by the Anthropic SDK)
 * Optional:
 *   ANTHROPIC_MODEL    - Claude model id; must support adaptive thinking and
 *                        the effort setting (Claude Opus 5, Sonnet 5, Opus 4.8,
 *                        Opus 4.7, Opus 4.6, Sonnet 4.6). Default: claude-opus-5
 *   ACCESS_CODE        - if set, the browser must send this class code before
 *                        the server will call the model
 *   GOOGLE_SITE_VERIFICATION_ID
 */
export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";

export default class AppConfig {
  static readonly anthropic = {
    model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
    /** Hard ceiling on output tokens per request (thinking tokens count). */
    maxOutputTokens: 4096,
    /** Ceiling on the system prompt (retrieved passages + instructions). */
    maxContextChars: 24000,
    /** Ceiling on the user message. */
    maxQuestionChars: 2000,
  };

  static readonly accessCode = process.env.ACCESS_CODE || "";

  /** Per-connection limits enforced in memory by the generate route. */
  static readonly rateLimit = {
    perMinute: 8,
    perHour: 60,
  };

  static readonly googleSiteVerificationId =
    process.env.GOOGLE_SITE_VERIFICATION_ID;
}
