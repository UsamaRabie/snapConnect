"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import type { IConversation, IMessage } from "@/types";
import { conversationApi } from "@/lib/api.service";
import { connectSocket, joinConversationRoom, leaveConversationRoom, emitTyping } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { getAvatarUrl, formatDate } from "@/lib/utils";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConv, setActiveConv] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const activeConvRef = useRef(activeConv);

  activeConvRef.current = activeConv;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await conversationApi.getConversations();
        setConversations(list);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const startConvId = searchParams.get("conversation");
    if (startConvId && conversations.length > 0) {
      const found = conversations.find((c) => c._id === startConvId);
      if (found) {
        setActiveConv(found);
      }
    }
  }, [searchParams, conversations]);

  const loadMessages = useCallback(async (convId: string, p: number) => {
    setIsLoadingMsgs(true);
    try {
      const result = await conversationApi.getMessages(convId, p);
      setMessages((prev) => (p === 1 ? result.messages : [...result.messages, ...prev]));
      setHasMore(result.pagination ? result.pagination.page < result.pagination.totalPages : false);
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  const openConversation = useCallback(async (conv: IConversation) => {
    joinConversationRoom(conv._id);
    setActiveConv(conv);
    setMessages([]);
    setPage(1);
    await loadMessages(conv._id, 1);
  }, [loadMessages]);

  const closeConversation = useCallback(() => {
    if (activeConvRef.current) {
      leaveConversationRoom(activeConvRef.current._id);
    }
    setActiveConv(null);
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    joinConversationRoom(activeConv._id);
    return () => leaveConversationRoom(activeConv._id);
  }, [activeConv?._id]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handler = (data: { conversationId: string; message: IMessage }) => {
      const current = activeConvRef.current;
      if (current && data.conversationId === current._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === data.conversationId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            _id: data.message._id,
            text: data.message.text || "",
            sender: data.message.sender.id,
            createdAt: data.message.createdAt,
          },
          updatedAt: data.message.createdAt,
        };
        updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return updated;
      });
    };

    const typingHandler = (data: { conversationId: string; userId: string }) => {
      const current = activeConvRef.current;
      if (current && data.conversationId === current._id && data.userId !== currentUser?.id) {
        setTypingUser(data.userId);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(""), 2000);
      }
    };

    socket.on("message:new", handler);
    socket.on("message:typing", typingHandler);

    return () => {
      socket.off("message:new", handler);
      socket.off("message:typing", typingHandler);
    };
  }, [currentUser?.id, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!activeConv || !text.trim()) return;
    const msgText = text;
    setText("");
    try {
      await conversationApi.sendMessage(activeConv._id, msgText);
    } catch {
      // silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (activeConv) {
      emitTyping(activeConv._id, currentUser!.id);
    }
  };

  const sortedConvs = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (isLoading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
      <div className={`w-full flex-shrink-0 border-r border-dark-600 lg:w-72 ${activeConv ? "hidden lg:flex" : "flex"} flex-col`}>
        <div className="border-b border-dark-600 p-4">
          <h2 className="text-sm font-semibold text-dark-50">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageCircle size={40} className="mb-3 text-dark-500" />
              <p className="text-sm text-dark-400">No conversations yet</p>
            </div>
          ) : (
            sortedConvs.map((conv) => {
              const isActive = activeConv?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-700 ${
                    isActive ? "bg-dark-700" : ""
                  }`}
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                    <img
                      src={getAvatarUrl(conv.otherUser.avatar, conv.otherUser.username)}
                      alt={conv.otherUser.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-dark-50">
                      {conv.otherUser.fullName || conv.otherUser.username}
                    </p>
                    <p className="truncate text-xs text-dark-400">
                      {conv.lastMessage
                        ? conv.lastMessage.text
                        : "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${activeConv ? "flex" : "hidden lg:flex"}`}>
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 border-b border-dark-600 p-4">
              <button
                onClick={closeConversation}
                className="p-1 text-dark-400 hover:text-dark-50 transition-colors lg:hidden"
              >
                <ArrowLeft size={20} />
              </button>
              <Link
                href={`/profile/${activeConv.otherUser.id}`}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-dark-500">
                  <img
                    src={getAvatarUrl(activeConv.otherUser.avatar, activeConv.otherUser.username)}
                    alt={activeConv.otherUser.username}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="truncate text-sm font-semibold text-dark-50">
                  {activeConv.otherUser.fullName || activeConv.otherUser.username}
                </p>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && isLoadingMsgs ? (
                <LoadingSpinner className="py-10" />
              ) : (
                <>
                  {hasMore && (
                    <div className="text-center">
                      <button
                        onClick={() => {
                          const next = page + 1;
                          setPage(next);
                          loadMessages(activeConv._id, next);
                        }}
                        disabled={isLoadingMsgs}
                        className="text-xs text-primary-500 hover:text-primary-400"
                      >
                        {isLoadingMsgs ? "Loading..." : "Load older messages"}
                      </button>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender.id === currentUser?.id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                            isMe
                              ? "bg-primary-500 text-white"
                              : "bg-dark-700 text-dark-50"
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <p className={`mt-0.5 text-[10px] ${isMe ? "text-white/70" : "text-dark-400"}`}>
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              {typingUser && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-dark-700 px-3 py-2 text-xs text-dark-400">
                    typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-dark-600 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Message..."
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 text-sm text-dark-50 placeholder-dark-400 focus:outline-none focus:border-primary-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="flex items-center justify-center rounded-lg bg-primary-500 p-2 text-white disabled:opacity-50 hover:bg-primary-600 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 text-dark-500" />
              <p className="text-sm text-dark-400">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
