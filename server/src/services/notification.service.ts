import Notification from "../models/notification.model";
import User from "../models/user.model";
import { paginateQuery } from "../utils/helpers";
import { emitNotification } from "../socket";

const NOTIF_POPULATE = {
  path: "sender",
  select: "username fullName avatar",
};

export const createNotification = async (
  recipientId: string,
  type: "follow" | "like" | "comment" | "reply" | "tag" | "message",
  senderId: string,
  postId?: string,
  commentId?: string
) => {
  if (recipientId === senderId) return;

  const recipient = await User.findById(recipientId).select("_id");
  if (!recipient) return;

  const notification = await Notification.create({
    recipient: recipientId,
    type,
    sender: senderId,
    post: postId || null,
    comment: commentId || null,
  });

  await Notification.populate(notification, NOTIF_POPULATE);

  const raw = notification.toObject() as any;
  const sanitized = {
    _id: raw._id.toString(),
    recipient: raw.recipient.toString(),
    type: raw.type,
    sender: {
      id: (raw.sender._id || raw.sender).toString(),
      username: raw.sender.username || "",
      fullName: raw.sender.fullName || "",
      avatar: raw.sender.avatar || "",
    },
    post: raw.post?.toString?.() || raw.post,
    comment: raw.comment?.toString?.() || raw.comment,
    isRead: raw.isRead,
    createdAt: raw.createdAt?.toISOString?.() || raw.createdAt,
    updatedAt: raw.updatedAt?.toISOString?.() || raw.updatedAt,
  };
  emitNotification(recipientId, sanitized);

  return sanitized;
};

export const getUserNotifications = async (
  userId: string,
  page?: number,
  limit?: number
) => {
  const { page: safePage, skip } = paginateQuery(page, limit);

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: userId })
      .populate(NOTIF_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safePage)
      .lean(),
    Notification.countDocuments({ recipient: userId }),
  ]);

  return {
    notifications: notifications.map((n) => {
      const sender = n.sender as any;
      return {
        _id: n._id.toString(),
        recipient: n.recipient.toString(),
        type: n.type,
        sender: {
          id: (sender._id || sender).toString(),
          username: sender.username || "",
          fullName: sender.fullName || "",
          avatar: sender.avatar || "",
        },
        post: n.post?.toString?.() || n.post,
        comment: n.comment?.toString?.() || n.comment,
        isRead: n.isRead,
        createdAt: n.createdAt?.toISOString?.() || n.createdAt,
        updatedAt: n.updatedAt?.toISOString?.() || n.updatedAt,
      };
    }),
    pagination: {
      page: safePage,
      limit: safePage,
      total,
      totalPages: Math.ceil(total / safePage),
    },
  };
};

export const getUnreadCount = async (userId: string) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) return null;

  return {
    _id: notification._id.toString(),
    isRead: true,
  };
};

export const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );

  return { modifiedCount: result.modifiedCount };
};
