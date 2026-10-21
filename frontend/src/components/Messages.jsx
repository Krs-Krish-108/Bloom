import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import useGetAllMessage from "../hooks/useGetAllMessage";
import useGetRTM from "../hooks/useGetRTM";

const Messages = ({ selectedUser }) => {
  useGetAllMessage();
  useGetRTM();

  const { messages } = useSelector((store) => store.chat);
  const { user } = useSelector((store) => store.auth);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
      {/* Top Profile Intro */}
      <div className="flex flex-col items-center justify-center my-6 text-center">
        <Avatar className="h-20 w-20 mb-3 border">
          <AvatarImage
            src={selectedUser?.profilePicture}
            alt={selectedUser?.username}
          />
          <AvatarFallback className="font-semibold text-lg">
            {selectedUser?.username?.slice(0, 2)?.toUpperCase() || "CN"}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-base">
          {selectedUser?.username}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">
          {selectedUser?.bio || "Instagram user"}
        </span>
        <Link
          to={`/profile/${selectedUser?._id}`}
          className="mt-3 text-xs font-semibold px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          View profile
        </Link>
      </div>

      {/* Message Bubbles */}
      <div className="flex flex-col gap-2.5">
        {messages &&
          messages.map((msg, index) => {
            const isSender = msg.senderId === user?._id;
            return (
              <div
                key={msg._id || `msg-${index}`}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] sm:max-w-[60%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-xs ${
                    isSender
                      ? "bg-sky-500 text-white rounded-br-xs"
                      : "bg-gray-100 text-gray-900 rounded-bl-xs"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}
        <div ref={scrollRef} />
      </div>
    </div>
  );
};

export default Messages;
