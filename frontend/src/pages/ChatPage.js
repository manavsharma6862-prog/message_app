import React, { useState } from "react";
import Navbar from "../components/Layout/Navbar";
import ChatList from "../components/Chat/ChatList";
import ChatBox from "../components/Chat/ChatBox";
import "./Pages.css";

const ChatPage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);

  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-layout">
        <ChatList fetchAgain={fetchAgain} />
        <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      </div>
    </div>
  );
};

export default ChatPage;
