export const RICH_MESSAGE_MAX_CHARS = 32768;

export function cleanUndefinedPayloadFields(value) {
  if (Array.isArray(value)) return value.map(cleanUndefinedPayloadFields);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, cleanUndefinedPayloadFields(entry)])
  );
}

export function telegramThreadIdFromContext(ctx) {
  const message = ctx?.msg ?? ctx?.message ?? ctx?.update?.message ?? ctx?.callbackQuery?.message;
  return message?.is_topic_message ? message.message_thread_id : undefined;
}

export function buildRichMarkdownPayload(ctx, markdown, extra = {}) {
  const replyParameters = extra.reply_parameters
    ?? (extra.replyToMessageId ? { message_id: extra.replyToMessageId } : undefined);
  return cleanUndefinedPayloadFields({
    chat_id: extra.chat_id ?? ctx?.chat?.id,
    message_thread_id: extra.message_thread_id ?? telegramThreadIdFromContext(ctx),
    rich_message: { markdown },
    reply_parameters: replyParameters
  });
}

export async function tryReplyRichMarkdown(ctx, markdown, extra = {}) {
  const text = String(markdown ?? "");
  if (Buffer.byteLength(text, "utf8") > RICH_MESSAGE_MAX_CHARS) {
    return { sent: false, fallback: true, reason: "too_long" };
  }

  try {
    const payload = buildRichMarkdownPayload(ctx, text, extra);
    const message = await ctx.telegram.callApi("sendRichMessage", payload);
    return { sent: true, fallback: false, message };
  } catch (error) {
    if (shouldFallbackFromRichError(error)) {
      return { sent: false, fallback: true, reason: "rich_rejected", error };
    }
    throw error;
  }
}

export function shouldFallbackFromRichError(error) {
  const code = error?.code ?? error?.statusCode ?? error?.response?.statusCode;
  if (code === 400 || code === 404) return true;

  const message = String(error?.description ?? error?.message ?? error ?? "").toLowerCase();
  if (!message) return false;
  if (/(timed? ?out|econnreset|econnrefused|eai_again|enotfound|network|socket hang up)/i.test(message)) {
    return false;
  }
  return (
    message.includes("bad request")
    || message.includes("not found")
    || message.includes("method")
    || message.includes("unsupported")
    || message.includes("rich_message")
    || message.includes("rich message")
    || message.includes("can't parse")
    || message.includes("failed to parse")
    || message.includes("message is too long")
  );
}
