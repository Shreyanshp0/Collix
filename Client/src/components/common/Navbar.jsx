import { Activity, Bell, ChevronDown, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';
import UserDropdown from './UserDropdown.jsx';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isGroupsRoute = location.pathname.startsWith('/groups');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          {isAuthenticated && (
            <Link
              to="/groups"
              className={`hidden min-w-[260px] items-center justify-start gap-3 rounded-md border-2 border-border px-3 py-2 text-left md:flex ${
                isGroupsRoute ? 'bg-surface shadow-group' : 'bg-[#0f131b]'
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText">
                <Users className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="section-label text-primaryText">03 Launch Strategy</p>
                <p className="truncate text-xs uppercase tracking-[0.22em] text-secondaryText">Current Group</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-primaryText" strokeWidth={2.25} />
            </Link>
          )}
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

              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-md border-2 border-border bg-[#0f131b] text-primaryText"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" strokeWidth={2.25} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-border bg-aiPurple text-[10px] font-black text-primaryText">
                  3
                </span>
              </button>

              <UserDropdown />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
