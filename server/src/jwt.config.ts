function obterSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  return 'lista-go-secret-key-super-segura-2026';
}

export const jwtConfig = {
  secret: obterSecret(),
  expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7), // 7 dias
};

