/**
 * Build-time replacement for ./demoGateway when NEXT_PUBLIC_ENABLE_DEMO is not
 * "true" (see next.config.ts). Keeps spoiler content out of the client bundle.
 */
export const demoGateway = null;
