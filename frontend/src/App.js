import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatProvider from "./context/ChatProvider";
import AuthPage from "./components/Auth/AuthPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Router>
      <ChatProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          toastStyle={{
            background: "#0d0d20",
            color: "#f0f0ff",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/chats" element={<ChatPage />} />
          <Route path="/" element={<Navigate to="/chats" replace />} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;
