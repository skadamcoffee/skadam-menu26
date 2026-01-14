"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");

  const MENU_URL = "/menu";

  const confirmTable = () => {
    const table = tableNumber.trim();
    if (!table) return;

    setModalText(`You're at table <strong>${table}</strong>`);
    setShowModal(true);

    setTimeout(() => {
      router.push(`${MENU_URL}?table=${encodeURIComponent(table)}`);
    }, 1200);
  };

  const browseMenu = () => {
    setModalText("Browsing as <strong>Guest</strong>");
    setShowModal(true);

    setTimeout(() => {
      router.push(MENU_URL);
    }, 1000);
  };

  const closeModal = () => {
    setShowModal(false);
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md p-4">
        {/* Logo */}
        <div className="relative flex items-center justify-center w-[220px] h-[220px] rounded-full bg-white/80 shadow-xl overflow-hidden animate-[floatLogo_4s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]">
          <div className="absolute w-[280px] h-[280px] -z-10 animate-[rotateBg_25s_linear_infinite]">
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
            className="w-[140px] h-[140px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]"
          />
        </div>

        {/* Card */}
        <div className="bg-[#f5ecd7] border-3 border-[#c9a96a] rounded-[28px] shadow-2xl w-full p-10 animate-[slideUp_0.8s_ease-out]">
          <div className="text-center mb-8">
            <h1 className="text-[#3b2a1a] font-bold text-2xl mb-2">
              Welcome! Ready to order?
            </h1>
            <p className="text-[#6b5a3a] text-sm font-medium">
              Please enter your table number.
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="table-input"
              className="block text-center text-[#5a3a1a] font-semibold text-[13px] mb-2"
            >
              TABLE NUMBER
            </label>
            <input
              type="text"
              id="table-input"
              placeholder="Table number (e.g., 5 or A1)"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmTable()}
              className="w-full h-12 rounded-lg border-2 border-[#d6c49a] text-center text-[#3b2a1a] placeholder-[#b6a885] px-4 focus:outline-none focus:border-[#c9a96a] focus:ring-2 focus:ring-[#c9a96a]/30"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={confirmTable}
              disabled={!tableNumber.trim()}
              className="h-12 bg-[#5a3a1a] text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4a2f15] transition-transform active:scale-95"
            >
              Confirm Table & Order
            </button>

            <button
              onClick={browseMenu}
              className="h-12 bg-[#b6b07a] text-[#2f2a12] rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#a9a36d] active:scale-95"
            >
              Browse Full Menu
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#f5ecd7] border-3 border-[#c9a96a] rounded-[28px] shadow-2xl max-w-sm w-full p-8 text-center animate-[slideUp_0.5s_ease-out]">
            <div className="w-14 h-14 bg-[#5a3a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-[#3b2a1a] font-bold text-xl mb-2">
              Table Confirmed!
            </h2>
            <p
              className="text-[#6b5a3a] text-sm mb-1"
              dangerouslySetInnerHTML={{ __html: modalText }}
            ></p>
            <p className="text-[#8a7a5a] text-xs mb-6">Redirecting to menu...</p>
            <button
              onClick={closeModal}
              className="bg-[#5a3a1a] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4a2f15] transition"
            >
              View Menu
            </button>
          </div>
        </div>
      )}

      {/* Tailwind Animations */}
      <style jsx>{`
        @keyframes floatLogo {
          0% { transform: translateY(0px) rotateZ(-0.5deg); }
          25% { transform: translateY(-16px) rotateZ(0.3deg); }
          50% { transform: translateY(-12px) rotateZ(-0.2deg); }
          75% { transform: translateY(-18px) rotateZ(0.4deg); }
          100% { transform: translateY(0px) rotateZ(-0.5deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
