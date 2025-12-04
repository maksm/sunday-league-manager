import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserDisplayInfo } from '@/lib/user-utils';
import { UserRole } from '@/types/api';
import UserMenu from '@/app/dashboard/UserMenu';
import styles from './DashboardHeader.module.css';
import { getLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { prisma } from '@/lib/prisma';

export default async function DashboardHeader() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const dict = await getDictionary(locale);
  const dashboard = dict.dashboard as Record<string, unknown>;

  let userPlayerName = session?.user?.name || 'User';
  let userRole: UserRole = UserRole.USER;
  let userTeamId: string | null = null;

  if (session?.user?.name) {
    const displayInfo = await getUserDisplayInfo(session.user.name);
    userPlayerName = displayInfo.displayName;
    userRole = displayInfo.role;

    // Get player's team
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      include: { player: true },
    });
    userTeamId = user?.player?.teamId || null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          <Link href="/dashboard">
            {process.env.NEXT_PUBLIC_APP_NAME || (dashboard.title as string) || 'Sunday League'}
          </Link>
        </h1>
      </div>
      <div className={styles.right}>
        <UserMenu userName={userPlayerName} userRole={userRole} teamId={userTeamId} />
      </div>
    </header>
  );
}
