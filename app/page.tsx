"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const MENU_URL = "/menu";

  const confirmTable = () => {
    const table = tableNumber.trim();
    if (!table) return;

    setModalText(`You're at table <strong>${table}</strong>`);
    setShowModal(true);
    setIsRedirecting(true);

    setTimeout(() => {
      router.push(`${MENU_URL}?table=${encodeURIComponent(table)}`);
    }, 2000); // Slightly longer for better UX
  };

  const browseMenu = () => {
    setModalText("Browsing as <strong>Guest</strong>");
    setShowModal(true);
    setIsRedirecting(true);

    setTimeout(() => {
      router.push(MENU_URL);
    }, 1500);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsRedirecting(false);
    router.push(MENU_URL);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://res.cloudinary.com/dgequg3ik/image/upload/v1768386002/Design_sans_titre_20260114_110907_0000_zmursc.png')",
      }}
    >
      {/* Warm coffee-toned overlay */}
      <div className="absolute inset-0 bg-[#2d1f14]/60 z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 sm:gap-10 w-full max-w-sm sm:max-w-md md:max-w-lg p-4">
        {/* Logo */}
        <div className="relative flex items-center justify-center w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full bg-white/90 shadow-2xl overflow-hidden animate-[floatLogo_4s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]">
          <div className="absolute w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] -z-10 animate-[rotateBg_25s_linear_infinite]">
            <svg viewBox="0 0 280 280" className="w-full h-full">
              <circle
                cx="140"
                cy="140"
                r="135"
                fill="none"
                stroke="rgba(201,169,106,0.1)"
                strokeWidth="1"
              />
              <circle
                cx="140"
                cy="140"
                r="110"
                fill="none"
                stroke="rgba(201,169,106,0.15)"
                strokeWidth="1"
              />
              <circle
                cx="140"
                cy="140"
                r="85"
                fill="none"
                stroke="rgba(201,169,106,0.2)"
                strokeWidth="1"
              />
              <circle
                cx="140"
                cy="140"
                r="60"
                fill="none"
                stroke="rgba(201,169,106,0.25)"
                strokeWidth="1"
              />
            </svg>
          </div>
          <img
            src="https://res.cloudinary.com/dgequg3ik/image/upload/v1768097629/4bd12479-1a42-4dcd-964c-91af38b632c8_20260111_031309_0000_oc3uod.png"
            alt="Skadam Logo"
            className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
            loading="lazy"
          />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gradient-to-br from-[#faf6ef] via-[#f0e9dc] to-[#e8dfd0] border-2 border-[#c9a96a]/70 rounded-3xl shadow-2xl w-full p-6 sm:p-8 md:p-10 backdrop-blur-sm ring-1 ring-[#c9a96a]/20"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-[#2d1f14] font-heading text-xl sm:text-2xl md:text-3xl mb-2 tracking-tight">
              Welcome! Ready to Order?
            </h1>
            <p className="text-[#5c4033] text-sm sm:text-base font-medium">
              Enter your table number to get started.
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="table-input"
              className="block text-center text-[#5a3a1a] font-semibold text-sm sm:text-base mb-3"
            >
              Table Number
            </label>
            <input
              type="text"
              id="table-input"
              placeholder="e.g., 5 or A1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmTable()}
              className="w-full h-12 sm:h-14 rounded-xl border-2 border-[#e0d5c4] bg-white/80 text-center text-[#2d1f14] placeholder-[#a68b5b] px-4 focus:outline-none focus:border-[#c9a96a] focus:ring-2 focus:ring-[#c9a96a]/30 transition-all"
              aria-label="Enter your table number"
            />
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={confirmTable}
              disabled={!tableNumber.trim()}
              className="h-12 sm:h-14 bg-gradient-to-r from-[#5c4033] to-[#3d2914] text-[#faf6ef] rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#6b5040] hover:to-[#4d3218] active:scale-95 transition-all duration-200 shadow-lg border border-[#c9a96a]/30"
              aria-label="Confirm table and proceed to order"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Order
            </button>

            <button
              onClick={browseMenu}
              className="h-12 sm:h-14 bg-[#e8dfd0] hover:bg-[#e0d5c4] text-[#2d1f14] border-2 border-[#c9a96a]/50 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 shadow-md"
              aria-label="Browse the full menu as a guest"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Menu
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-gradient-to-br from-[#faf6ef] to-[#e8dfd0] border-2 border-[#c9a96a]/70 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#5c4033] to-[#3d2914] rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_1s_ease-in-out] border border-[#c9a96a]/40">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-[#2d1f14] font-heading text-xl sm:text-2xl mb-3">
                Confirmed!
              </h2>
              <p
                className="text-[#5c4033] text-sm sm:text-base mb-2"
                dangerouslySetInnerHTML={{ __html: modalText }}
              ></p>
              <p className="text-[#8a7a5a] text-xs sm:text-sm mb-6">Redirecting to menu...</p>
              {isRedirecting && (
                <div className="w-full bg-[#d6c49a] rounded-full h-2 mb-4">
                  <div className="bg-[#c9a96a] h-2 rounded-full animate-[progress_2s_ease-in-out]"></div>
                </div>
              )}
              <button
                onClick={closeModal}
                className="bg-gradient-to-r from-[#5c4033] to-[#3d2914] text-[#faf6ef] px-6 py-3 rounded-xl font-semibold hover:from-[#6b5040] hover:to-[#4d3218] transition-all duration-200 shadow-lg border border-[#c9a96a]/30"
                aria-label="Proceed to view the menu"
              >
                View Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tailwind Animations */}
      <style jsx>{`
        @keyframes floatLogo {
          0% { transform: translateY(0px) rotateZ(-0.5deg); }
          25% { transform: translateY(-16px) rotateZ(0.3deg); }
          50% { transform: translateY(-12px) rotateZ(-0.2deg); }
          75% { transform: translateY(-18px) rotateZ(0.4deg); }
          100% { transform: translateY(0px) rotateZ(-0.5deg); }
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
