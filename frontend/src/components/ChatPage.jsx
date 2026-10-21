import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Messages from "./Messages";
import { setSelectedUser, setMessages } from "../redux/chatSlice";
import { MESSAGE_API_END_POINT } from "@/utils/constants";

const ChatPage = () => {
  const [textMessage, setTextMessage] = useState("");
  const dispatch = useDispatch();

  const { user, suggestedUsers } = useSelector((store) => store.auth);
  const { onlineUsers, selectedUser, messages } = useSelector(
    (store) => store.chat
  );

  const sendMessageHandler = async (e) => {
    e?.preventDefault();
    if (!textMessage.trim() || !selectedUser?._id) return;

    try {
      const res = await axios.post(
        `${MESSAGE_API_END_POINT}/send/${selectedUser._id}`,
        { message: textMessage.trim() },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        dispatch(setMessages([...messages, res.data.newMessage]));
        setTextMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Clear selected user on unmount so returning to chat doesn't lock stale chat
  useEffect(() => {
    return () => {
      dispatch(setSelectedUser(null));
    };
  }, [dispatch]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left Column: Chat User List (1:3 or 1:4 ratio on desktop, hidden on mobile when chat open) */}
      <section
        className={`${
          selectedUser ? "hidden md:flex" : "flex"
        } w-full md:w-1/4 lg:w-[280px] shrink-0 border-r border-gray-200 flex-col h-full bg-white select-none`}
      >
        <div className="px-5 py-4 border-b border-gray-200 shrink-0">
          <h1 className="font-bold text-xl text-neutral-900">{user?.username}</h1>
          <span className="text-xs text-gray-500 font-medium">Messages</span>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {suggestedUsers && suggestedUsers.length > 0 ? (
            suggestedUsers.map((chatUser) => {
              const isOnline = onlineUsers.includes(chatUser?._id);
              const isSelected = selectedUser?._id === chatUser?._id;

              return (
                <div
                  key={chatUser?._id}
                  onClick={() => dispatch(setSelectedUser(chatUser))}
                  className={`flex gap-3 items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? "bg-gray-100 font-semibold" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={chatUser?.profilePicture}
                        alt={chatUser?.username}
                      />
                      <AvatarFallback>
                        {chatUser?.username?.slice(0, 2)?.toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate text-gray-900">
                      {chatUser?.username}
                    </span>
                    <span
                      className={`text-xs truncate ${
                        isOnline ? "text-green-600 font-medium" : "text-gray-400"
                      }`}
                    >
                      {isOnline ? "online" : "offline"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-5 text-center text-sm text-gray-400">
              No suggested users found
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Active Conversation or Empty State (Full width & full screen on mobile when user selected) */}
      {selectedUser ? (
        <section className="fixed inset-0 z-50 md:static flex-1 w-full flex flex-col h-full bg-white min-w-0 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex gap-3 items-center px-4 md:px-6 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0">
            {/* Mobile Back Button to return to user list */}
            <button
              type="button"
              onClick={() => dispatch(setSelectedUser(null))}
              className="md:hidden p-1.5 -ml-1 text-gray-700 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              aria-label="Back to messages list"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="relative shrink-0">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={selectedUser?.profilePicture}
                  alt={selectedUser?.username}
                />
                <AvatarFallback>
                  {selectedUser?.username?.slice(0, 2)?.toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>
              {onlineUsers.includes(selectedUser?._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate text-gray-900">
                {selectedUser?.username}
              </span>
              <span className="text-[11px] text-gray-400">
                {onlineUsers.includes(selectedUser?._id) ? "Active now" : "Offline"}
              </span>
            </div>
          </div>

          {/* Messages */}
          <Messages selectedUser={selectedUser} />

          {/* Message Input */}
          <form
            onSubmit={sendMessageHandler}
            className="p-3 md:p-4 border-t border-gray-200 flex items-center gap-2 bg-white shrink-0"
          >
            <Input
              type="text"
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 focus-visible:ring-transparent border-gray-200 rounded-full px-4 text-sm"
            />
            <Button
              type="submit"
              disabled={!textMessage.trim()}
              className="rounded-full bg-sky-500 hover:bg-sky-600 text-white px-4 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </section>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-center px-4 h-full bg-white select-none">
          <div className="w-24 h-24 rounded-full border-2 border-black flex items-center justify-center">
            <MessageCircle className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Messages</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Send private photos and messages to a friend or group.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Select a person on the left to start chatting.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
