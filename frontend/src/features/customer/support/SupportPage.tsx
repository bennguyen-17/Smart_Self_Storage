import React from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import SupportForm from './components/SupportForm';

export default function SupportPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const activeNav = (tab === 'tickets' || tab === 'history') ? 'tickets' : 'support';

  return (
    <CustomerLayout activeNav={activeNav}>
      <motion.div
        key="page-customer-support"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1"
      >
        <SupportForm />
      </motion.div>
    </CustomerLayout>
  );
}
