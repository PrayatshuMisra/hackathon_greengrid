import React, { useState } from 'react';
import HelpCenterModal from '@/components/map/HelpCenterModal'; // Adjust path if needed

const Support = () => {
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);

  return (
    <div className="space-y-4 p-4 rounded shadow bg-white max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Support</h2>
      <button
        className="w-full bg-purple-100 py-2 rounded"
        onClick={() => setIsHelpCenterOpen(true)}
      >
        Help Center
      </button>

      {/* You can add other buttons later */}

      <HelpCenterModal isOpen={isHelpCenterOpen} onRequestClose={() => setIsHelpCenterOpen(false)} />
    </div>
  );
};

export default Support;
