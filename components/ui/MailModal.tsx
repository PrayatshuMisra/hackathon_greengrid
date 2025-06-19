import React, { useState } from "react";
import Modal from "react-modal";

type MailModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  sender: string; // Supabase user email
  subject: string;
  recipient: string;
};

const MailModal = ({
  isOpen,
  onRequestClose,
  sender,
  subject,
  recipient,
}: MailModalProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(
      `This message was submitted by GreenGrid User ID: ${sender}\n\n${message}`
    )}`;
    window.open(mailtoLink);
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="bg-white p-6 rounded shadow-lg max-w-xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <h2 className="text-xl font-bold mb-4">{subject}</h2>
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-2 text-green-800 text-sm font-medium">
        Feature: Be it any email-id, we will always register your mail which is
        linked to your GreenGrid Account!
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 text-sm">
        Click on the below button to submit your query via your default mailing
        app
      </div>

      <button
        onClick={handleSend}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Open in Mail App
      </button>
    </Modal>
  );
};

export default MailModal;
