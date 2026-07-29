import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import PageContainer from './PageContainer.jsx';

function MainLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex-1 min-h-0 overflow-hidden">
        <PageContainer className="h-full max-w-[1600px] overflow-hidden pb-4 pt-4">
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}

export default MainLayout;
