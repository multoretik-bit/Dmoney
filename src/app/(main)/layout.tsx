import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col pt-safe relative">
      <main className="flex-1 w-full max-w-md mx-auto relative pb-24 overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
