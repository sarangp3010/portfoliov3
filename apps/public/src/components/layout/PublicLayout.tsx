import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useTracker } from '../../hooks/useTracker';
import { Scene3D } from '../ui/Scene3D';
import { Chatbot } from '../ui/Chatbot';

export const PublicLayout = () => {
  useTracker();
  return (
    <div className="min-h-screen flex flex-col">
      <Scene3D variant="default" />
      <Navbar />
      <main className="flex-1 pt-16 page-enter">
        <Outlet />
      </main>
      <Footer />
      {/* AI assistant — public context, no auth token */}
      <Chatbot context="public" />
    </div>
  );
};
