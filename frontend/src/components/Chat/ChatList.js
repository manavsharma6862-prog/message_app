import React, { useState, useEffect } from "react";
import { ChatState } from "../../context/ChatProvider";
import { fetchChats, accessChat, searchUsers, createGroupChat } from "../../utils/api";
import { getSender } from "../../utils/chatLogic";
import { toast } from "react-toastify";
import "./Chat.css";

const ChatList = ({ fetchAgain }) => {
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChats = async () => {
    try {
      const { data } = await fetchChats();
      setChats(data);
    } catch {
      toast.error("Failed to load chats");
    }
  };

  useEffect(() => {
    loadChats();
  }, [fetchAgain]);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await searchUsers(val);
      setSearchResults(data);
    } catch {
      toast.error("Search failed");
    }
  };

  const handleSelectUser = async (userId) => {
    try {
      const { data } = await accessChat(userId);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setShowSearch(false);
      setSearch("");
      setSearchResults([]);
    } catch {
      toast.error("Could not open chat");
    }
  };

  const handleGroupSearch = async (e) => {
    const val = e.target.value;
    setGroupSearch(val);
    if (!val.trim()) { setGroupSearchResults([]); return; }
    try {
      const { data } = await searchUsers(val);
      setGroupSearchResults(data);
    } catch {
      toast.error("Search failed");
    }
  };

  const addUserToGroup = (u) => {
    if (groupUsers.find((g) => g._id === u._id)) return toast.warning("User already added");
    setGroupUsers([...groupUsers, u]);
  };

  const removeGroupUser = (u) => {
    setGroupUsers(groupUsers.filter((g) => g._id !== u._id));
  };

  const handleCreateGroup = async () => {
    if (!groupName || groupUsers.length < 2) {
      return toast.error("Provide group name and at least 2 users");
    }
    try {
      setLoading(true);
      const { data } = await createGroupChat({
        name: groupName,
        users: JSON.stringify(groupUsers.map((u) => u._id)),
      });
      setChats([data, ...chats]);
      setShowGroupModal(false);
      setGroupName("");
      setGroupUsers([]);
      toast.success("Group created!");
    } catch {
      toast.error("Failed to create group");
    }
    setLoading(false);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <div className="header-actions">
          <button
            className="icon-btn"
            title="New Group"
            onClick={() => setShowGroupModal(true)}
          >➕</button>
          <button
            className="icon-btn"
            title="Search"
            onClick={() => setShowSearch(!showSearch)}
          >🔍</button>
        </div>
      </div>

      {showSearch && (
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
          />
          <div className="search-results">
            {searchResults.map((u) => (
              <div key={u._id} className="search-item" onClick={() => handleSelectUser(u._id)}>
                <div className="avatar">{u.name[0]}</div>
                <div>
                  <p className="name">{u.name}</p>
                  <p className="email">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chats-container">
        {chats.length === 0 ? (
          <div className="empty-state">
            <p>No chats yet.</p>
            <p>Search for users to start chatting!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item ${selectedChat?._id === chat._id ? "active" : ""}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-avatar">
                {chat.isGroupChat ? "👥" : (getSender(user, chat.users)[0] || "?")}
              </div>
              <div className="chat-info">
                <p className="chat-name">
                  {chat.isGroupChat ? chat.chatName : getSender(user, chat.users)}
                </p>
                <p className="chat-preview">
                  {chat.latestMessage
                    ? `${chat.latestMessage.sender?.name?.split(" ")[0]}: ${
                        chat.latestMessage.content?.length > 30
                          ? chat.latestMessage.content.substring(0, 30) + "..."
                          : chat.latestMessage.content
                      }`
                    : "No messages yet"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Group Chat</h3>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search users to add..."
              value={groupSearch}
              onChange={handleGroupSearch}
            />
            <div className="group-tags">
              {groupUsers.map((u) => (
                <span key={u._id} className="tag">
                  {u.name}
                  <button onClick={() => removeGroupUser(u)}>×</button>
                </span>
              ))}
            </div>
            <div className="search-results">
              {groupSearchResults.map((u) => (
                <div key={u._id} className="search-item" onClick={() => addUserToGroup(u)}>
                  <div className="avatar">{u.name[0]}</div>
                  <p className="name">{u.name}</p>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button className="primary" onClick={handleCreateGroup} disabled={loading}>
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
