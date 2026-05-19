import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { checkMongooseIDValidation } from '../../../shared/checkMongooseIDValidation';
import { Chat } from '../chat/chat.model';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import { getIO } from '../../../helpers/socketManager';
import { notificationQueue } from '../../../queues';
import { logger } from '../../../shared/logger';

// Send a new message and notify chat participants
const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  payload.readBy = [payload.sender];

  const isExistChat = await Chat.findById(payload.chatId);
  if (!isExistChat) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
  }

  if (!isExistChat.participants.some(p => p?.toString() === payload.sender?.toString())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You are not a participant!");
  }

  const response = await Message.create(payload);

  // Update the chat with latest message information
  await Chat.findByIdAndUpdate(payload.chatId, {
    lastMessage: response._id,
    lastMessageAt: new Date()
  });

  try {
    const io = getIO();
    if (io && payload.chatId) {
      const chatNamespace = io.of('/chat');

      // Dispatch real-time gateway events to the specific chat room
      chatNamespace.to(payload.chatId.toString()).emit(`message::received`, {...response, type: 'created'});

      // Notify participants to update their chat list
      isExistChat.participants.forEach((participantId: any) => {
        io.of('/notifications').to(`user:${participantId.toString()}`).emit(`chatListUpdate::${participantId.toString()}`, {
          chatId: payload.chatId,
          lastMessage: response,
        });
      });
    }
  } catch (error) {
    logger.error("Socket error in sendMessageToDB:", error);
  }

  // Handle push notifications for participants
  try {
    const chatStatus = await Chat.findById(payload.chatId);
    if (chatStatus) {
      const sender = await User.findById(payload.sender).select('fullName role');
      const title = sender?.fullName || "New Message";
      const body = payload.text ?
        (payload.text.length > 50 ? payload.text.substring(0, 50) + "..." : payload.text) :
        "Sent an attachment";

      const recipientId = chatStatus.participants.find(
        (p: any) => p.toString() !== payload.sender.toString()
      );

      if (recipientId) {
        // Check if recipient is currently in the chat room to avoid redundant push notifications
        const io = getIO();
        const chatNamespace = io.of('/chat');
        const socketsInRoom = await chatNamespace.in(payload.chatId.toString()).fetchSockets();
        const isRecipientInRoom = socketsInRoom.some(
          (s: any) => s.data?.user?.authId?.toString() === recipientId.toString()
        );

        if (!isRecipientInRoom) {
          await notificationQueue.add('push-notification', {
            userId: recipientId.toString(),
            title,
            body,
            data: { screen: "CHAT", chatId: payload.chatId?.toString() }
          });
        }
      }
    }
  } catch (error) {
    logger.error("Failed to process push notification logic:", error);
  }

  return response;
};

// Retrieve paginated messages for a chat and mark as read
const getMessageFromDB = async (
  id: string,
  user: JwtPayload,
  query: Record<string, any>
): Promise<{ messages: IMessage[], pagination: any, participant: any }> => {
  checkMongooseIDValidation(id, "Chat");

  const isExistChat = await Chat.findById(id);
  if (!isExistChat) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
  }

  if (!isExistChat.participants.some(p => p.toString() === user.authId.toString())) {
    throw new Error('You are not participant of this chat')
  }

  // Mark all unread messages as read by current user
  await Message.updateMany(
    {
      chatId: new mongoose.Types.ObjectId(id),
      sender: { $ne: new mongoose.Types.ObjectId(user.authId) },
      readBy: { $ne: new mongoose.Types.ObjectId(user.authId) }
    },
    {
      $addToSet: { readBy: new mongoose.Types.ObjectId(user.authId) }
    }
  );

  const result = new QueryBuilder(
    Message.find({ chatId: id })
      .populate('sender', 'fullName image')
      .sort({ createdAt: -1 }),
    query
  ).paginate();

  let messages = await result.modelQuery;
  const pagination = await result.getPaginationInfo();
  messages = messages.reverse();

  const participant = await Chat.findById(id).populate({
    path: 'participants',
    select: '-_id fullName image ',
    match: {
      _id: { $ne: new mongoose.Types.ObjectId(user.authId) }
    }
  });

  return { messages, pagination, participant: participant?.participants[0] };
};

// Update existing message content
const updateMessageToDB = async (messageId: string, userId: string, payload: Partial<IMessage>): Promise<IMessage | null> => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only update your own messages");
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    payload,
    { new: true }
  );

  try {
    const io = getIO();
    if (io && updatedMessage) {
      io.of('/chat').to(updatedMessage.chatId.toString()).emit(`message::received`, {...updatedMessage, type: 'updated'});
    }
  } catch (error) {
    logger.error("Socket error in updateMessageToDB:", error);
  }

  return updatedMessage;
};

// Get the count of unread messages in a specific chat
const getUnreadCountForChat = async (chatId: string, userId: string): Promise<number> => {
  return await Message.countDocuments({
    chatId: new mongoose.Types.ObjectId(chatId),
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose.Types.ObjectId(userId) }
  });
};

// Get the collective unread message count for a user across all chats
const getTotalUnreadCount = async (userId: string): Promise<number> => {
  const chats = await Chat.find({
    participants: new mongoose.Types.ObjectId(userId)
  }).select('_id');

  const chatIds = chats.map(chat => chat._id);

  return await Message.countDocuments({
    chatId: { $in: chatIds },
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose.Types.ObjectId(userId) }
  });
};

// Permanently delete a message
const deleteMessageFromDB = async (messageId: string, userId: string): Promise<IMessage | null> => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only delete your own messages");
  }

  const res = await Message.findByIdAndDelete(messageId)
    try {
    const io = getIO();
    if (io && res) {
      io.of('/chat').to(res.chatId.toString()).emit(`message::received`, {...res, type: 'deleted'});
    }
  } catch (error) {
    logger.error("Socket error in deleteMessageToDB:", error);
  }
  return res;
};



export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  updateMessageToDB,
  getUnreadCountForChat,
  getTotalUnreadCount,
  deleteMessageFromDB
};