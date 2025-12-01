import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import styles from '../page.module.css'; // Reuse dashboard styles
import HistoryList from '@/components/HistoryList';

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.sectionTitle}>Match History</h1>
        <HistoryList />
      </main>
    </div>
  );
}
