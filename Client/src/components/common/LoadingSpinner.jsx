import { LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        className="brutal-panel flex items-center gap-3 px-6 py-4"
      >
        <LoaderCircle className="h-5 w-5" />
        <span className="section-label text-primaryText">{label}</span>
      </motion.div>
    </div>
  );
}

export default LoadingSpinner;
