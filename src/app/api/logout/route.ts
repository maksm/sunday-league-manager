import { NextResponse } from 'next/server';

export async function GET() {
  // Create a response that redirects to the home page
  const response = NextResponse.redirect(
    new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3001')
  );

  // Clear the NextAuth session cookie
  response.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Also try to clear the __Secure variant if it exists
  response.cookies.set('__Secure-next-auth.session-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
    maxAge: 0,
  });

  return response;
}
