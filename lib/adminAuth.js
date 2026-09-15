import crypto from 'crypto';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ofertasTOP@2026!Admin';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'ofertasTOP_super_secret_session_key_2026';

export function createAdminToken() {
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', SECRET).update(`admin_${timestamp}`).digest('hex');
  return Buffer.from(`${timestamp}:${signature}`).toString('base64');
}

export function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [timestamp, signature] = decoded.split(':');
    if (!timestamp || !signature) return false;

    // Token valido por 7 dias
    const tokenTime = parseInt(timestamp, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - tokenTime > maxAge) return false;

    const expected = crypto.createHmac('sha256', SECRET).update(`admin_${timestamp}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAuthenticatedAdmin(request) {
  // 1. Checa header Authorization se fornecido
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (verifyAdminToken(token)) return true;
    }
  }

  // 2. Checa cookie HTTP-only
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    return verifyAdminToken(token);
  } catch {
    return false;
  }
}

export function checkPassword(password) {
  if (!password) return false;
  return password === ADMIN_PASSWORD;
}
