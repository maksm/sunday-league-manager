import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { getServerTranslations, t } from '@/i18n/server';

export async function POST(request: Request) {
  try {
    const dict = await getServerTranslations();

    // Get the current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: t(dict, 'errors.auth.unauthorized') }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: t(dict, 'validation.general.currentAndNewPassword') },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: t(dict, 'validation.general.newPasswordMinLength', { min: '6' }) },
        { status: 400 }
      );
    }

    // Get the user from the database
    const user = await prisma.user.findFirst({
      where: {
        username: session.user.name!,
      },
    });

    if (!user) {
      return NextResponse.json({ error: t(dict, 'errors.auth.userNotFound') }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: t(dict, 'errors.auth.currentPasswordIncorrect') },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({ message: t(dict, 'errors.auth.resetPasswordSuccess') });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: t(await getServerTranslations(), 'errors.auth.resetPasswordError') },
      { status: 500 }
    );
  }
}
