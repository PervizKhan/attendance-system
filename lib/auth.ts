// lib/auth.ts
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Reads the adminToken cookie, verifies the JWT, and returns the user.
 * Returns null if the token is missing, invalid, or not an admin.
 *
 * Use in API routes:
 *   const user = await requireAdmin();
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as {
      id?: string;
      email?: string;
      role?: string;
    };

    const role = decoded.role || 'admin';
    if (role !== 'admin') return null;

    return {
      id: decoded.id || '',
      email: decoded.email || '',
      role,
    };
  } catch {
    return null;
  }
}