import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageContainer from '../layouts/PageContainer.jsx';

function NotFoundPage() {
  return (
    <PageContainer className="flex min-h-screen items-center justify-center py-12">
      <section className="w-full max-w-2xl rounded-md border-2 border-border bg-surface p-8 text-center shadow-panel">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border-2 border-border bg-background shadow-brutal">
          <SearchX className="h-7 w-7 text-groupBlue" strokeWidth={2.25} />
        </div>
        <p className="section-label mt-6 text-groupBlue">404</p>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-[0.14em] text-primaryText">
          Route Not Found
        </h1>
        <p className="mt-4 text-sm leading-7 text-secondaryText">
          The page you requested does not exist in this frontend foundation.
        </p>
        <Link to="/login" className="brutal-button mt-8">
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Back To Login
        </Link>
      </section>
    </PageContainer>
  );
}

export default NotFoundPage;
