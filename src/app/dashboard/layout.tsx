import DashboardHeader from '@/components/DashboardHeader';
import styles from './page.module.css'; // Reusing container styles if possible, or just inline for now

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
