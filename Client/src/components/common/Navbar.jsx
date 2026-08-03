import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';
import UserDropdown from './UserDropdown.jsx';
import CurrentGroupDropdown from './CurrentGroupDropdown.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';

function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b-2 border-border bg-[#07090d]">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-3 py-1 sm:px-4 lg:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link to={isAuthenticated ? '/groups' : '/login'} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-border bg-aiPurple text-xl font-black uppercase text-background shadow-ai">
              N
            </div>
            <div>
              <p className="text-[2rem] font-black uppercase leading-none tracking-[0.12em] text-primaryText">
                Nexus <span className="text-aiPurple">AI</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondaryText">
                Group-grounded collaboration
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Group selector (compact) */}
        <div className="flex-1 flex items-center justify-center">
          {isAuthenticated && <CurrentGroupDropdown />}
        </div>

        {/* Right: utilities */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <div className="hidden items-center gap-3 rounded-md border-2 border-border bg-[#0f131b] px-3 py-2 lg:flex">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-presenceGreen">
                  <span className="h-2.5 w-2.5 rounded-full bg-presenceGreen" />
                  ● AI ONLINE
                </span>
                <Activity className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
              </div>

              <NotificationBell />

              <UserDropdown />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
