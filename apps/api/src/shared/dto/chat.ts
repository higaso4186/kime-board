import { z } from "zod";
import { ChatChannel, Message, MessageRelatesTo, SenderType, ThreadScopeType } from "../domain/chat";
import { ChatFormat } from "../constants/status";

export const CreateThreadRequest = z.object({
  channel: ChatChannel.default("IN_APP"),
  scopeType: ThreadScopeType.optional(),
  scopeId: z.string().min(1).optional(),
  title: z.string().optional(),
});
export const CreateThreadResponse = z.object({
  threadId: z.string().min(1),
});

export const PostMessageRequest = z.object({
  senderType: SenderType,
  format: ChatFormat,
  content: z.string(),
  metadata: z.any().optional(),
  relatesTo: MessageRelatesTo.optional(),
});
export const PostMessageResponse = z.object({
  messageId: z.string().min(1),
});

export const ListMessagesResponse = z.object({
  messages: z.array(Message),
});
