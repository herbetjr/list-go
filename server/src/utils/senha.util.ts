import { randomBytes, scrypt as scryptCb, scryptSync, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (
  senha: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

/** Gera o hash da senha no formato `salt:hash` (scrypt). */
export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** Compara a senha informada com o hash `salt:hash` salvo, em tempo constante. */
export async function verificarSenha(senha: string, armazenado: string): Promise<boolean> {
  const [salt, hash] = armazenado.split(':');
  if (!salt || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const calculado = await scrypt(senha, salt, esperado.length);
  return timingSafeEqual(esperado, calculado);
}

