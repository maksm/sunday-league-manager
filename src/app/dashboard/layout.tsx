import DashboardHeader from '@/components/DashboardHeader';
import BackToTopButton from '@/components/BackToTopButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
      <BackToTopButton />
    </>
  );
}
