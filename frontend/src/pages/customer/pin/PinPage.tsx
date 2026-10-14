import React from 'react';
import { motion } from 'motion/react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import PinDisplay from './components/PinDisplay';

export default function PinPage() {
  return (
    <CustomerLayout activeNav="gate-pin">
      <motion.div
        key="page-gate-pin"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1"
      >
        <PinDisplay />
      </motion.div>
    </CustomerLayout>
  );
}
