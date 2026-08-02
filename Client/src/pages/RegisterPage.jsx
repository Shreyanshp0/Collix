import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer.jsx';
import useAuth from '../hooks/useAuth.jsx';

const initialForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function RegisterPage() {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/groups', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-3xl rounded-md border-2 border-border bg-surface p-6 shadow-panel sm:p-8"
      >
        <p className="section-label text-groupBlue">02 Register</p>
        <h1 className="mt-4 text-3xl font-bold uppercase tracking-[0.14em] text-primaryText sm:text-4xl">
          Create Your Collaboration Identity
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-secondaryText">
          Enter your details to create an account and join group workspaces.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block space-y-2 sm:col-span-2">
            <span className="section-label text-primaryText">Username</span>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="brutal-input pl-11"
                placeholder="Your username"
                required
                disabled={submitting}
              />
            </div>
          </label>

          <label className="block space-y-2 sm:col-span-2">
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
                disabled={submitting}
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
                disabled={submitting}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="section-label text-primaryText">Confirm Password</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="brutal-input pl-11"
                placeholder="Repeat password"
                required
                disabled={submitting}
              />
            </div>
          </label>

          <button type="submit" className="brutal-button sm:col-span-2" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register'}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </form>

        <p className="mt-6 text-sm text-secondaryText">
          Already registered?{' '}
          <Link to="/login" className="font-bold uppercase tracking-[0.14em] text-groupBlue">
            Login
          </Link>
        </p>
      </motion.div>
    </PageContainer>
  );
}

export default RegisterPage;
