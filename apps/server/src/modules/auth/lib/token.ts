export function extractBearer(
  authorization: string | undefined,
): string | undefined {
  if (!authorization?.toLowerCase().startsWith('bearer ')) return undefined;
  const token = authorization.slice(7).trim();
  return token || undefined;
}
