import { formatCodexAnswerMarkdownHtml, formatCodexAnswerSafeHtml } from "./markdown.js";
import { tryReplyRichMarkdown } from "./rich.js";
import { splitMarkdownAware } from "./split.js";

export async function replyFormattedCodexAnswer(ctx, text, options = {}) {
  const {
    format = "markdown",
    maxTelegramChars = 3500,
    replyHtml,
    replyLong,
    tryRichMarkdown = tryReplyRichMarkdown
  } = options;

  if (typeof replyHtml !== "function") throw new TypeError("replyHtml option is required.");
  if (typeof replyLong !== "function") throw new TypeError("replyLong option is required.");

  if (format === "off") {
    await replyLong(ctx, text);
    return;
  }

  if (format === "markdown") {
    const richResult = await tryRichMarkdown(ctx, text);
    if (richResult.sent) return;
  }

  const max = Math.max(500, maxTelegramChars);
  for (const chunk of splitMarkdownAware(text, max)) {
    const html = format === "markdown"
      ? formatCodexAnswerMarkdownHtml(chunk)
      : formatCodexAnswerSafeHtml(chunk);
    await replyHtml(ctx, html);
  }
}
