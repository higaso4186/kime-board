import { z } from "zod";
import { ChatChannel, Message, SenderType } from "../domain/chat";
import { ChatFormat } from "../constants/status";

export const CreateThreadRequest = z.object({
  channel: ChatChannel.default("IN_APP"),
});
export const CreateThreadResponse = z.object({
  threadId: z.string().min(1),
});

export const PostMessageRequest = z.object({
  senderType: SenderType,
  format: ChatFormat,
  content: z.string(),
  metadata: z.any().optional(),
});
export const PostMessageResponse = z.object({
  messageId: z.string().min(1),
});

export const ListMessagesResponse = z.object({
  messages: z.array(Message),
});
