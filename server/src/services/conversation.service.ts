import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { paginateQuery } from "../utils/helpers";
import { emitNewMessage } from "../socket";
import { createNotification } from "./notification.service";

export const getOrCreateConversation = async (userId: string, otherUserId: string) => {
  const participants = [userId, otherUserId].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId], $size: 2 },
  }).populate("lastMessage");

  if (!conversation) {
    conversation = await Conversation.create({ participants });
    await conversation.populate("lastMessage");
  }

  return conversation;
};

export const getUserConversations = async (userId: string) => {
  const conversations = await Conversation.find({ participants: userId })
    .populate("participants", "username fullName avatar")
    .populate("lastMessage")
    .sort({ updatedAt: -1 })
    .lean();

  return conversations.map((c) => {
    const other = (c.participants as any[]).find(
      (p: any) => (p._id || p).toString() !== userId
    );
    const lastMsg = c.lastMessage as any;
    return {
      _id: c._id.toString(),
      otherUser: {
        id: (other._id || other).toString(),
        username: other.username || "",
        fullName: other.fullName || "",
        avatar: other.avatar || "",
      },
      lastMessage: lastMsg
        ? {
            _id: lastMsg._id.toString(),
            text: lastMsg.text,
            sender: lastMsg.sender?.toString?.() || lastMsg.sender,
            createdAt: lastMsg.createdAt?.toISOString?.() || lastMsg.createdAt,
          }
        : null,
      updatedAt: c.updatedAt?.toISOString?.() || c.updatedAt,
    };
  });
};

export const getConversationMessages = async (
  conversationId: string,
  userId: string,
  page?: number,
  limit?: number
) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.participants.some((p) => p.toString() === userId)) {
    throw new Error("Not authorized");
  }

  const { page: safePage, limit: safeLimit, skip } = paginateQuery(page, limit);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  return {
    messages: messages.reverse().map((m) => {
      const s = m.sender as any;
      return {
        _id: m._id.toString(),
        conversation: m.conversation.toString(),
        sender: {
          id: (s._id || s).toString(),
          username: s.username || "",
          fullName: s.fullName || "",
          avatar: s.avatar || "",
        },
        text: m.text,
        image: m.image,
        isRead: m.isRead,
        createdAt: m.createdAt?.toISOString?.() || m.createdAt,
      };
    }),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text?: string
) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.participants.some((p) => p.toString() === senderId)) {
    throw new Error("Not authorized");
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: text || "",
  });

  await message.populate("sender", "username fullName avatar");

  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();
  await conversation.save();

  const sanitized = {
    _id: message._id.toString(),
    conversation: conversationId,
    sender: {
      id: (message.sender as any)._id.toString(),
      username: (message.sender as any).username,
      fullName: (message.sender as any).fullName,
      avatar: (message.sender as any).avatar,
    },
    text: message.text,
    image: message.image,
    isRead: message.isRead,
    createdAt: message.createdAt?.toISOString?.() || message.createdAt,
  };

  const participantIds = conversation.participants.map((p) => p.toString());
  const otherUserId = participantIds.find((pid) => pid !== senderId);
  if (otherUserId) {
    createNotification(otherUserId, "message", senderId);
  }
  emitNewMessage(conversationId, sanitized, participantIds);

  return sanitized;
};
