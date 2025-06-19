"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import {
  FaWhatsapp,
  FaLinkedin,
  FaXTwitter,
  FaInstagram,
  FaFacebook,
} from "react-icons/fa6";

type CertificateProps = {
  userName: string;
  challengeTitle: string;
  points: number;
  date?: string;
};

export function CertificatePreview({
  userName,
  challengeTitle,
  points,
  date = new Date().toLocaleDateString(),
}: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const timeout = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  const handleDownload = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", "a4");
    pdf.addImage(imgData, "PNG", 40, 40, 750, 500);
    pdf.save(`${userName}_certificate.pdf`);
  };

  const handleShare = async (platform: string) => {
    if (!certRef.current) return;

    const canvas = await html2canvas(certRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "certificate.png", { type: "image/png" });

    const shareUrl = window.location.origin;
    const text = `🎉 I just completed the "${challengeTitle}" challenge on GreenGrid and earned ${points} EcoPoints! 🌿`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "GreenGrid Certificate",
          text,
          url: shareUrl,
          files: [file],
        });
        return;
      } catch (err) {
        console.error("Native share failed:", err);
      }
    }

    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareUrl);

    const shareLinks: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      instagram: "https://www.instagram.com/", // Cannot directly deep link to media upload
    };

    window.open(shareLinks[platform], "_blank");
  };

  return (
    <div className="space-y-4 relative">
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} />}

      {/* Certificate */}
      <div
        ref={certRef}
        className="relative w-full border-4 border-green-700 rounded-lg shadow-xl text-center bg-white dark:bg-white"
        style={{
          maxWidth: "800px",
          margin: "auto",
          padding: "2rem",
          backgroundImage: "url('/leaf-background-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-800 p-3 rounded-full">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-green-900 ml-3">GreenGrid</h1>
        </div>

        <h1 className="text-2xl font-bold text-green-800 mb-2 underline">Certificate of Achievement</h1>
        <p className="text-green-700 mb-2">This is proudly presented to</p>
        <h3 className="text-2xl font-bold text-zinc-900 mb-4">{userName}</h3>

        <p className="text-green-900 text-lg mb-2 font-semibold">
          for successfully completing the <strong>{challengeTitle}</strong> challenge
        </p>

        <p className="text-gray-600 mb-4">Awarded on {date}</p>
        <p className="text-lg font-semibold text-green-800 mb-6">Points Earned: {points}</p>

        {/* Signature */}
        <div className="flex flex-col items-center mt-8">
          <img src="/signature-greengrid.png" alt="GreenGrid Team Signature" className="h-16 object-contain" />
          <p className="text-xs text-green-700 mt-1">Authorized Signature</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleDownload}
          className="bg-green-700 hover:bg-green-800 transition-transform duration-200 hover:scale-105 text-white"
        >
          Download PDF
        </Button>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => handleShare("whatsapp")}>
            <FaWhatsapp className="mr-2 text-green-600" /> Share on WhatsApp
          </Button>
          <Button variant="outline" onClick={() => handleShare("linkedin")}>
            <FaLinkedin className="mr-2 text-blue-700" /> Share on LinkedIn
          </Button>
          <Button variant="outline" onClick={() => handleShare("x")}>
            <FaXTwitter className="mr-2 text-black" /> Share on X
          </Button>
          <Button variant="outline" onClick={() => handleShare("facebook")}>
            <FaFacebook className="mr-2 text-blue-600" /> Share on Facebook
          </Button>
          <Button variant="outline" onClick={() => handleShare("instagram")}>
            <FaInstagram className="mr-2 text-pink-600" /> Open Instagram
          </Button>
        </div>
      </div>
    </div>
  );
}
