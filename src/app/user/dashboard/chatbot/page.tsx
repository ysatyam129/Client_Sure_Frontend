"use client";

import React, { useState } from "react";
import ChatbotSidebar from "../../../../components/ChatbotSidebar";
import AiCompose from "../../../../components/AiCompose";

const ChatbotPage = () => {
  const [selectedBot, setSelectedBot] = useState("email");

  return (
    <div className="min-h-screen bg-[#f5f7ff] flex">
      {/* Sidebar */}
      <ChatbotSidebar selected={selectedBot} onSelect={setSelectedBot} />

      {/* Main AI Page */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <AiCompose channel={selectedBot} />
      </div>
    </div>
  );
};

export default ChatbotPage;