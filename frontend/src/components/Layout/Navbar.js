import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../context/ChatProvider";
import { toast } from "react-toastify";
import { updateProfile } from "../../utils/api";
import "./Layout.css";

const Navbar = () => {
  const { user, setUser, notification, setNotification, setSelectedChat } = ChatState();
  const [showProfile, setShowProfile] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [status, setStatus] = useState(user?.status || "");
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/login");
    toast.info("Logged out successfully");
  };

  const handleUpdate = async () => {
    try {
      const { data } = await updateProfile({ name, status });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      setShowProfile(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo">💬</div>
        <h1>ChatApp</h1>
      </div>

      <div className="nav-actions">
        {/* Notification bell */}
        <div className="notif-wrapper">
          <button
            className="icon-btn"
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
          >
            🔔
            {notification.length > 0 && (
              <span className="notif-badge">{notification.length}</span>
            )}
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <p className="notif-title">Notifications</p>
              {notification.length === 0 ? (
                <p className="no-notif">No new notifications</p>
              ) : (
                notification.map((n) => (
                  <div
                    key={n._id}
                    className="notif-item"
                    onClick={() => {
                      setSelectedChat(n.chat);
                      setNotification(notification.filter((x) => x !== n));
                      setShowNotif(false);
                    }}
                  >
                    <p>New message from <strong>{n.sender?.name}</strong></p>
                    <p className="notif-preview">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <button
          className="profile-btn"
          onClick={() => setShowProfile(true)}
          title="Profile"
        >
          <div className="nav-avatar">{user?.name?.[0]}</div>
          <span>{user?.name}</span>
        </button>

        <button className="logout-btn" onClick={handleLogout} title="Logout">
          🚪
        </button>
      </div>

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <div className="profile-avatar-lg">{user?.name?.[0]}</div>
            <p className="profile-email">{user?.email}</p>
            <div className="form-group">
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Status</label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Your status..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowProfile(false)}>Cancel</button>
              <button className="primary" onClick={handleUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
