import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import AIChatWidget from "./AIChatWidget";

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button - Always visible, changes icon when chat is open */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-700 text-black rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-2 border-black hover:scale-110 ${
          isOpen ? "z-[9998]" : "z-[9999]"
        }`}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        style={{ zIndex: isOpen ? 9998 : 9999 }}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-black" strokeWidth={2.5} />
        ) : (
          <MessageCircle className="w-7 h-7 text-black" strokeWidth={2.5} fill="none" />
        )}
      </button>

      {/* Chat Widget */}
      <AIChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

