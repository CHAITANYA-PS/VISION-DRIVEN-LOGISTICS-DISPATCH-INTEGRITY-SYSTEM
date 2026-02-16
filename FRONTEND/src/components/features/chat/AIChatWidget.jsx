import { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare, Loader2 } from "lucide-react";
import { askQuestion } from "../../../services/agenticAIService";
import { formatRelativeTime } from "../../../utils/formatters";
import Button from "../../common/Button";

const INITIAL_AI_MESSAGE = "Hi there 👋 I'm the AI Assistant. How can I help you today?";

export default function AIChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: INITIAL_AI_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleNewChat = () => {
    setMessages([
      {
        id: 1,
        type: "ai",
        content: INITIAL_AI_MESSAGE,
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setError("");
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || loading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);
    setError("");

    try {
      const response = await askQuestion(question);
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || "Failed to get response from AI. Please try again.");
      
      // Add error message as AI message
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-end p-4 pointer-events-none" style={{ zIndex: 9998 }}>
      {/* Backdrop - Transparent to show background */}
      <div
        className="fixed inset-0 bg-transparent transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      {/* Chat Widget */}
      <div className="relative w-full max-w-md bg-gray-50 rounded-xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] flex flex-col pointer-events-auto transform transition-all duration-300 ease-out border border-gray-200 overflow-hidden" style={{ height: 'min(600px, 90vh)', maxHeight: '90vh' }}>
        {/* Header Section - Primary Blue */}
        <div className="flex-shrink-0 bg-primary-600 rounded-t-xl px-4 py-4 shadow-sm" style={{ backgroundColor: "#2563EB" }}>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-white">Chat with our AI</h2>
            <p className="text-xs text-white">Ask any question and our AI will answer!</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm hover:shadow-md transition-shadow mt-1"
            >
              New chat
            </Button>
          </div>
        </div>

        {/* Chat Messages Area - Light greyish background */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50 custom-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                  message.type === "user"
                    ? "bg-primary-600 text-white shadow-md"
                    : message.isError
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
                style={message.type === "user" ? { backgroundColor: "#2563EB", color: "#ffffff" } : {}}
              >
                {message.type === "ai" && (
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-medium">AI Assistant</span>
                  </div>
                )}
                <p className={`text-sm whitespace-pre-wrap break-words ${
                  message.type === "user" ? "text-white" : message.isError ? "text-red-800" : "text-gray-900"
                }`}>{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatRelativeTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-100/50 rounded-b-xl shadow-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 shadow-sm focus:shadow-md transition-shadow"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className={`p-2 rounded-full transition-all border ${
                inputValue.trim() && !loading
                  ? "bg-white hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md"
                  : "bg-gray-200 cursor-not-allowed border-gray-300"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <Send className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

