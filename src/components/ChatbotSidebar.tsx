"use client";

import React from "react";
import { Mail, MessageSquare, Linkedin, FileText, Smartphone } from "lucide-react";

interface ChatbotSidebarProps {
  selected: string;
  onSelect: (id: string) => void;
}

const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({ selected, onSelect }) => {
  const buttons = [
    { id: "email", label: "Email", icon: <Mail size={18} /> },
    { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare size={18} /> },
    { id: "linkedin", label: "LinkedIn", icon: <Linkedin size={18} /> },
    { id: "sms", label: "SMS", icon: <Smartphone size={18} /> },
    { id: "contract", label: "Contract", icon: <FileText size={18} /> },
  ];

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col p-4 space-y-3 shadow-sm">
      <h1 className="text-xl font-semibold mb-4 text-indigo-600">AI Bots</h1>

      {buttons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => onSelect(btn.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
            selected === btn.id
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {btn.icon} {btn.label}
        </button>
      ))}
    </div>
  );
};

export default ChatbotSidebar;