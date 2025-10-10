import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Message {
  _id?: string;
  roomId: string;
  senderId: { _id: string; name: string; email: string };
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UnreadCount {
  [userId: string]: number;
}

interface UnreadMessages {
  [userId: string]: Message[];
}

interface LastMessageTimes {
  [userId: string]: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount>({});
  const [, setUnreadMessages] = useState<UnreadMessages>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<LastMessageTimes>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'alumni' | 'student' | 'faculty'>('all');
  
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastViewedRef = useRef<LastMessageTimes>({});
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return user._id && currentUser?._id && 
           user._id !== currentUser._id && 
           matchesSearch && 
           matchesRole;
  });

  // Initialize Socket.IO and user data
  useEffect(() => {
    setIsLoading(true);
    
    if (!socketRef.current) {
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      });

      newSocket.on('messageRead', (data: { messageId: string }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, isRead: true } : msg
          )
        );
        setUnreadMessages((prev) => {
          const updated = { ...prev };
          for (const userId in updated) {
            updated[userId] = updated[userId].filter((msg) => msg._id !== data.messageId);
          }
          return updated;
        });
        console.log(`Message ${data.messageId} marked as read`);
      });

      newSocket.on('receiveMessage', (message: Message) => {
        setMessages((prev) => {
          const messageExists = prev.some((m) => m._id === message._id);
          if (!messageExists) {
            const senderId = message.senderId._id;
            if (senderId !== currentUser?._id && senderId !== selectedUser?._id && !message.isRead) {
              setUnreadCounts((prev) => ({
                ...prev,
                [senderId]: (prev[senderId] || 0) + 1,
              }));
              setUnreadMessages((prev) => ({
                ...prev,
                [senderId]: [...(prev[senderId] || []), message],
              }));
            }
            setLastMessageTimes((prev) => ({
              ...prev,
              [senderId]: message.timestamp,
            }));
            return [message, ...prev];
          }
          return prev;
        });
      });
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/current-user', {
          headers: { email: localStorage.getItem('email') },
          withCredentials: true,
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/chat/users', {
          withCredentials: true,
        });
        setUsers(response.data);
        
        const initialLastViewed: LastMessageTimes = {};
        response.data.forEach((user: User) => {
          if (user._id !== currentUser?._id) {
            initialLastViewed[user._id] = new Date(0).toISOString();
          }
        });
        lastViewedRef.current = initialLastViewed;
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchCurrentUser();
    fetchUsers();

    refreshIntervalRef.current = setInterval(fetchUsers, 30000);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('receiveMessage');
        socketRef.current.off('messageRead');
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [navigate]);

  // Fetch last message times and initial unread messages
  useEffect(() => {
    if (users.length > 0 && currentUser) {
      const fetchLastMessageTimesAndUnread = async () => {
        const times: LastMessageTimes = {};
        const unread: UnreadMessages = {};
        const counts: UnreadCount = {};

        await Promise.all(users.map(async (user) => {
          if (user._id === currentUser._id) return;
          
          const roomId = [currentUser._id, user._id].sort().join('-');
          try {
            const response = await axios.get(
              `http://localhost:5000/api/chat/history/${roomId}`,
              { withCredentials: true }
            );
            if (response.data.length > 0) {
              times[user._id] = response.data[0].timestamp;
              const unreadForUser = response.data
                .filter((msg: Message) => !msg.isRead && msg.senderId._id !== currentUser._id)
                .reverse();
              if (unreadForUser.length > 0) {
                unread[user._id] = unreadForUser;
                counts[user._id] = unreadForUser.length;
              }
            }
          } catch (error) {
            console.error(`Error fetching history for user ${user._id}:`, error);
          }
        }));
        
        setLastMessageTimes(times);
        setUnreadMessages(unread);
        setUnreadCounts(counts);
      };
      
      fetchLastMessageTimesAndUnread();
    }
  }, [users, currentUser]);

  // Handle room joining and message receiving
  useEffect(() => {
    if (!socketRef.current || !selectedUser || !currentUser) return;

    const roomId = [currentUser._id, selectedUser._id].sort().join('-');
    socketRef.current.emit('joinRoom', { roomId });

    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/chat/history/${roomId}`,
          { withCredentials: true }
        );
        const reversedMessages = response.data.reverse();
        setMessages(reversedMessages);

        const unreadMessagesForRoom = reversedMessages.filter(
          (msg: Message) => !msg.isRead && msg.senderId._id !== currentUser._id
        );
        if (unreadMessagesForRoom.length > 0) {
          const messageIds = unreadMessagesForRoom
            .map((msg: Message) => msg._id)
            .filter((id: any): id is string => !!id);
          if (messageIds.length > 0) {
            socketRef.current?.emit('markMessagesAsRead', {
              roomId,
              messageIds,
            });
            setUnreadCounts((prev) => ({
              ...prev,
              [selectedUser._id]: 0,
            }));
            setUnreadMessages((prev) => ({
              ...prev,
              [selectedUser._id]: [],
            }));
          }
        }
        
        if (reversedMessages.length > 0) {
          const lastMessage = reversedMessages[0];
          const otherUserId = 
            lastMessage.senderId._id === currentUser._id 
              ? selectedUser._id 
              : lastMessage.senderId._id;
          
          setLastMessageTimes(prev => ({
            ...prev,
            [otherUserId]: lastMessage.timestamp
          }));
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
    const messageRefreshInterval = setInterval(fetchChatHistory, 10000);

    return () => {
      clearInterval(messageRefreshInterval);
    };
  }, [selectedUser, currentUser]);

  // Scroll to the top
  useEffect(() => {
    messagesTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count and messages when selecting a user
  useEffect(() => {
    if (selectedUser) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedUser._id]: 0
      }));
      setUnreadMessages(prev => ({
        ...prev,
        [selectedUser._id]: []
      }));
      lastViewedRef.current = {
        ...lastViewedRef.current,
        [selectedUser._id]: new Date().toISOString()
      };
    }
  }, [selectedUser]);

  // Update document title
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    document.title = totalUnread > 0 
      ? `(${totalUnread}) Alumni Portal Chat` 
      : 'Alumni Portal Chat';
  }, [unreadCounts]);

  const sendMessage = () => {
    if (!socketRef.current || !messageInput.trim() || !selectedUser || !currentUser) return;

    const roomId = [currentUser._id, selectedUser._id].sort().join('-');
    const messageData = {
      roomId,
      senderId: currentUser._id,
      message: messageInput,
    };

    const optimisticMessage: Message = {
      roomId,
      senderId: { _id: currentUser._id, name: currentUser.name, email: currentUser.email },
      message: messageInput,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    setMessageInput('');
    
    socketRef.current.emit('sendMessage', messageData);
  };

  const deleteAllChats = async () => {
    try {
      if (!currentUser) return;
      
      const confirmed = window.confirm('Are you sure you want to delete all your chats? This action cannot be undone.');
      if (!confirmed) return;
  
      const response = await axios.delete('http://localhost:5000/api/chat/delete-all', {
        headers: { email: localStorage.getItem('email') },
        withCredentials: true
      });
      
      setMessages([]);
      setSelectedUser(null);
      setUnreadCounts({});
      setUnreadMessages({});
      
      alert(response.data.message);
    } catch (error) {
      console.error('Error deleting chats:', error);
      alert('Failed to delete chats');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[calc(100vh-4rem)]">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* User List - Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-indigo-700">Messages</h2>
          
          {/* Search Box */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          {/* Role Filter */}
          <div className="flex mt-3 space-x-1">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 text-xs rounded-full ${roleFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('alumni')}
              className={`px-3 py-1 text-xs rounded-full ${roleFilter === 'alumni' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Alumni
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 text-xs rounded-full ${roleFilter === 'student' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Students
            </button>
            <button
              onClick={() => setRoleFilter('faculty')}
              className={`px-3 py-1 text-xs rounded-full ${roleFilter === 'faculty' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Faculty
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-2">No conversations found</p>
            </div>
          ) : (
            filteredUsers
              .sort((a, b) => {
                const timeA = lastMessageTimes[a._id] || '0';
                const timeB = lastMessageTimes[b._id] || '0';
                return timeB.localeCompare(timeA);
              })
              .map((user) => (
                <div
                  key={user._id}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors ${
                    selectedUser?._id === user._id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      {unreadCounts[user._id] ? (
                        <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCounts[user._id]}
                        </span>
                      ) : null}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        {lastMessageTimes[user._id] && (
                          <span className="text-xs text-gray-500">
                            {new Date(lastMessageTimes[user._id]).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.role}</p>
                      
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-300 flex items-center justify-center text-white font-medium mr-3">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold">{selectedUser.name}</h2>
                  <p className="text-sm text-indigo-100">{selectedUser.role}</p>
                </div>
              </div>
              <button
                onClick={deleteAllChats}
                className="text-white hover:text-indigo-200"
                title="Delete all chats"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div ref={messagesTopRef} />
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId._id === currentUser?._id;
                return (
                  <div
                    key={msg._id || msg.timestamp}
                    className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                        isCurrentUser
                          ? 'bg-indigo-500 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {!isCurrentUser && (
                        <p className="font-semibold text-sm text-indigo-600">{msg.senderId.name}</p>
                      )}
                      <p className={`break-words ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                        {msg.message}
                      </p>
                      <div className="flex items-center justify-end mt-1">
                        <span className={`text-xs ${isCurrentUser ? 'text-indigo-100' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isCurrentUser && (
                          <span className="ml-1">
                            {msg.isRead ? (
                              <svg
                                className="h-4 w-4 text-indigo-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 5l7 7-7 7"
                                  transform="translate(5, 0)"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-4 w-4 text-indigo-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <svg
              className="h-24 w-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700">Select a conversation</h3>
            <p className="mt-1 text-gray-500">Choose a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;