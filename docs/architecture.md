# Architecture

Codex Telegram Bot connects Telegram chats to Codex CLI through
`@openai/codex-sdk`.

## Flow

```text
Telegram user
  -> Telegraf bot
  -> chat authorization
  -> command/router layer
  -> queue and thread state
  -> @openai/codex-sdk
  -> Codex CLI/auth/config
  -> Telegram response
```

## Main Components

- `src/bot.js`: thin executable entrypoint that imports the runtime.
- `src/runtime.js`: Telegram handlers, queueing, settings, cleanup, backups,
  formatting, and Codex thread orchestration.
- `src/telegram_commands.js`: registered command detection used to separate
  real Telegram commands from slash-prefixed paths or normal text.
- `scripts/codex_maintenance.py`: backup-first local Codex maintenance helper.
- `scripts/github_comment_upsert.mjs`: GitHub Actions helper for stable PR
  comments.
- `.github/workflows/ci.yml`: syntax, test, and optional build checks.
- `.github/workflows/codex-pr-review.yml`: optional Codex OAuth PR review.
- `.github/workflows/codex-ci-diagnosis.yml`: optional failed CI diagnosis.

## State

Runtime state is local and should not be committed:

- bot state file
- queued messages
- downloaded Telegram images
- cleanup artifacts
- backups
- Codex sessions

The queue is persisted so messages can survive a bot restart.

## Message Handling

Text messages go to the current Codex thread unless they are registered Telegram
commands. Unknown slash-prefixed text such as `/home/user/project` is treated as
normal input so filesystem paths can be sent naturally.

Photos and image documents are downloaded locally and sent as SDK `local_image`
inputs.

Reply context is prepended to the next Codex turn, and replied-to images are
included when possible.

## Queue Modes

- `safe`: queue while a turn is active.
- `interrupt`: stop the active turn and run the new request next.
- `side`: answer the new request in a separate side thread while the active
  turn continues.
