export function normalizeTelegramId(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function telegramReplyExtraFromMeta(meta = {}, extra = {}) {
  const next = { ...extra };
  const messageThreadId = normalizeTelegramId(meta.messageThreadId);
  const replyToMessageId = normalizeTelegramId(meta.replyToMessageId ?? meta.originMessageId);
  if (messageThreadId != null && next.message_thread_id == null) next.message_thread_id = messageThreadId;
  if (replyToMessageId != null && next.reply_parameters == null && next.reply_to_message_id == null) {
    next.reply_parameters = { message_id: replyToMessageId };
  }
  return next;
}

export function telegramChatActionExtraFromMeta(meta = {}) {
  const messageThreadId = normalizeTelegramId(meta.messageThreadId);
  return messageThreadId == null ? undefined : { message_thread_id: messageThreadId };
}

export function telegramSyntheticMessageFromMeta(meta = {}) {
  const messageThreadId = normalizeTelegramId(meta.messageThreadId);
  return messageThreadId == null ? undefined : {
    message_thread_id: messageThreadId,
    is_topic_message: true
  };
}
