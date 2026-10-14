import React, { useState } from 'react';
import { motion } from 'motion/react';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import SupportForm from './components/SupportForm';
import SupportTicketModal from './modals/SupportTicketModal';

export default function SupportPage() {
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <CustomerLayout activeNav="support">
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

      {/* Modal gửi ticket nếu người dùng cần */}
      {showSupportModal && (
        <SupportTicketModal
          onClose={() => setShowSupportModal(false)}
        />
      )}
    </CustomerLayout>
  );
}
