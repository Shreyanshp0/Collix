import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer.jsx';
import useAuth from '../hooks/useAuth.jsx';

const initialForm = {
  email: '',
  password: '',
};

function LoginPage() {
  const [formData, setFormData] = useState(initialForm);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/groups';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Login form values:', formData);
    login({
      email: formData.email,
      username: formData.email.split('@')[0] || 'Demo User',
    });
    toast.success('Mock login complete.');
    navigate(redirectPath, { replace: true });
  };

  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <section className="rounded-md border-2 border-border bg-surface p-6 shadow-panel sm:p-8">
          <p className="section-label text-groupBlue">Collaborative Chat Platform</p>
          <h1 className="mt-4 text-3xl font-bold uppercase tracking-[0.14em] text-primaryText sm:text-5xl">
            Login To Your Group Workspace
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-secondaryText sm:text-base">
            Phase 1 establishes the frontend shell only. Authentication is mock-based, routing is real, and the
            layout follows the Neo-Brutalist dark system defined in the project docs.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border-2 border-border bg-background p-4">
              <p className="section-label text-aiPurple">AI Accent</p>
              <p className="mt-3 text-sm text-secondaryText">Reserved for grounded AI surfaces only.</p>
            </div>
            <div className="rounded-md border-2 border-border bg-background p-4">
              <p className="section-label text-presenceGreen">Presence</p>
              <p className="mt-3 text-sm text-secondaryText">Reserved for member status and typing signals.</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border-2 border-border bg-surface p-6 shadow-panel sm:p-8">
          <p className="section-label">01 Login</p>
          <h2 className="mt-4 text-2xl font-bold uppercase tracking-[0.14em] text-primaryText">
            Enter Credentials
          </h2>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="section-label text-primaryText">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="brutal-input pl-11"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="section-label text-primaryText">Password</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="brutal-input pl-11"
                  placeholder="Enter password"
                  required
                />
              </div>
            </label>

            <button type="submit" className="brutal-button w-full">
              Login
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </form>

          <p className="mt-6 text-sm text-secondaryText">
            Need an account?{' '}
            <Link to="/register" className="font-bold uppercase tracking-[0.14em] text-groupBlue">
              Register
            </Link>
          </p>
        </section>
      </motion.div>
    </PageContainer>
  );
}

export default LoginPage;
