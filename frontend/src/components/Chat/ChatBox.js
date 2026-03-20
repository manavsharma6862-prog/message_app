import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { ChatState } from "../../context/ChatProvider";
import { getMessages, sendMessage } from "../../utils/api";
import { getSenderFull, isSameSender, isLastMessage, formatTime } from "../../utils/chatLogic";
import { toast } from "react-toastify";
import "./Chat.css";

const ENDPOINT = process.env.REACT_APP_API_URL || "http://localhost:10000";
let socket, selectedChatCompare;

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { user, selectedChat, notification, setNotification } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    socket.on("message received", (newMsg) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMsg.chat._id) {
        if (!notification.includes(newMsg)) {
          setNotification([newMsg, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMsg]);
      }
    });
  });

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const { data } = await getMessages(selectedChat._id);
      setMessages(data);
      socket.emit("join chat", selectedChat._id);
    } catch {
      toast.error("Failed to load messages");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (!newMessage.trim()) return;
      socket.emit("stop typing", selectedChat._id);
      try {
        const { data } = await sendMessage({
          content: newMessage,
          chatId: selectedChat._id,
        });
        setNewMessage("");
        socket.emit("new message", data);
        setMessages([...messages, data]);
        setFetchAgain(!fetchAgain);
      } catch {
        toast.error("Failed to send message");
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    setTimeout(() => {
      const timeNow = new Date().getTime();
      if (timeNow - lastTypingTime >= 2000 && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 2000);
  };

  if (!selectedChat) {
    return (
      <div className="chatbox-empty">
        <div className="empty-icon">💬</div>
        <h3>Select a conversation</h3>
        <p>Choose a chat from the left or search for a user to start messaging</p>
      </div>
    );
  }

  const chatName = selectedChat.isGroupChat
    ? selectedChat.chatName
    : getSenderFull(user, selectedChat.users)?.name;

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <div className="chat-header-info">
          <div className="avatar large">{chatName?.[0] || "?"}</div>
          <div>
            <h3>{chatName}</h3>
            <p className="status">
              {selectedChat.isGroupChat
                ? `${selectedChat.users.length} members`
                : "Online"}
            </p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isOwn = msg.sender._id === user._id;
              const showAvatar =
                isSameSender(messages, msg, i, user._id) ||
                isLastMessage(messages, i, user._id);
              return (
                <div
                  key={msg._id}
                  className={`message-wrapper ${isOwn ? "own" : "other"}`}
                >
                  {!isOwn && showAvatar && (
                    <div className="msg-avatar" title={msg.sender.name}>
                      {msg.sender.name[0]}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="msg-avatar-placeholder" />}
                  <div className="message-bubble">
                    {!isOwn && selectedChat.isGroupChat && (
                      <p className="sender-name">{msg.sender.name}</p>
                    )}
                    <p className="msg-content">{msg.content}</p>
                    <span className="msg-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="message-input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={handleSend}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
