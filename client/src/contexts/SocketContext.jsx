import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const useSocket = useSocketContext;

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && token) {
      const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
        auth: {
          token: token,
        },
      });

      setSocket(socketInstance);

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on("newMessage", (msg) => {
        // If we receive a message that isn't ours, mark it as delivered
        if (msg.sender._id !== user._id) {
          socketInstance.emit("markDelivered", { 
            messageId: msg._id, 
            senderId: msg.sender._id 
          });
        }
      });

      return () => {
        socketInstance.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
