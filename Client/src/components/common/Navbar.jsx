import { Activity, Bell, BrainCircuit, ChevronDown, LogOut, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.jsx';

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
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-3 py-2 sm:px-4 lg:px-6">
        <Link to={isAuthenticated ? '/groups' : '/login'} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-border bg-aiPurple text-2xl font-black uppercase text-background shadow-ai">
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

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && (
            <>
              <Link
                to="/groups"
                className={`hidden min-w-[280px] items-center justify-start gap-3 rounded-md border-2 border-border px-3 py-3 text-left md:flex ${
                  isGroupsRoute ? 'bg-surface shadow-group' : 'bg-[#0f131b]'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText">
                  <Users className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="section-label text-primaryText">03 Launch Strategy</p>
                  <p className="truncate text-xs uppercase tracking-[0.22em] text-secondaryText">Active Group</p>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-primaryText" strokeWidth={2.25} />
              </Link>

              <div className="hidden items-center gap-3 rounded-md border-2 border-border bg-[#0f131b] px-4 py-3 lg:flex">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-presenceGreen">
                  <span className="h-2.5 w-2.5 rounded-full bg-presenceGreen" />
                  Online
                </span>
                <Activity className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
              </div>

              <button
                type="button"
                className="relative flex h-12 w-12 items-center justify-center rounded-md border-2 border-border bg-[#0f131b] text-primaryText"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" strokeWidth={2.25} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-aiPurple text-[10px] font-black text-primaryText">
                  3
                </span>
              </button>

              <div className="hidden min-w-[220px] items-center gap-3 rounded-md border-2 border-border bg-[#0f131b] px-3 py-2 sm:flex">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-background">
                  <BrainCircuit className="h-5 w-5 text-groupBlue" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-primaryText">
                    {user?.username}
                  </p>
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-secondaryText">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="ml-auto h-4 w-4 text-primaryText" strokeWidth={2.25} />
              </div>

              <button type="button" className="brutal-button px-3 py-3 text-[11px]" onClick={handleLogout}>
                <LogOut className="h-4 w-4" strokeWidth={2.25} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
