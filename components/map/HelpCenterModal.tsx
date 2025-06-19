import React, { useEffect } from 'react';
import Modal from 'react-modal';

type HelpCenterModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
};

const HelpCenterModal = ({ isOpen, onRequestClose }: HelpCenterModalProps) => {
  useEffect(() => {
    // Only run this on the client after the DOM has mounted
    if (typeof window !== 'undefined') {
      Modal.setAppElement(document.body);
    }
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="bg-white p-6 rounded shadow-lg max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <h2 className="text-xl font-bold mb-4">Help Center - Map</h2>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4539.066953372679!2d74.7902421112881!3d13.352532086944747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbca4a7d2c4edb7%3A0x8d588d4fb81d861f!2sManipal%20Institute%20of%20Technology!5e1!3m2!1sen!2sin!4v1750325605578!5m2!1sen!2sin"
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
      <button
        onClick={onRequestClose}
        className="mt-4 text-blue-600 underline"
      >
        Close
      </button>
    </Modal>
  );
};

export default HelpCenterModal;
