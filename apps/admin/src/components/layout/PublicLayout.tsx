import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useTracker } from '../../hooks/useTracker';

export const PublicLayout = () => {
  useTracker();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16"><Outlet /></main>
      <Footer />
    </div>
  );
};
