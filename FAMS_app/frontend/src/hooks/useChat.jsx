import { createContext, useContext, useEffect, useState } from "react";
const backendUrl = '/api';
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const transcribeAudio = async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }
    const data = await response.json();
    return data.text;
  };

  const chat = async (message) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.details || data.error);
      setMessages((messages) => [...messages, ...data.messages]);
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback to default messages if API fails
      setMessages((messages) => [...messages, {
        text: "I'm having trouble connecting right now...",
        audio: null,
        lipsync: null,
        facialExpression: "sad",
        animation: "Crying"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text, audioFile) => {
    const message = audioFile ? await transcribeAudio(audioFile) : text;
    chat(message);
  };

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        sendMessage,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};