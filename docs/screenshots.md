# Screenshot Guide

Screenshots and GIFs are useful for public project pages, but Telegram bot
screens often contain private chat ids, prompts, file paths, and tokens in logs.

Recommended public-safe captures:

- `/menu`: main panel with no private chat text visible
- `/settings`: model, sandbox, language, time zone, and locale buttons
- `/queue`: queue panel using synthetic sample prompts
- `/tools`: health, backup, cleanup, and maintenance buttons
- cleanup approval message with fake session ids

Before adding images to the repository:

- redact Telegram names, user ids, chat ids, and bot usernames
- avoid showing real local paths unless they are generic examples
- avoid showing Codex prompts that contain private context
- avoid showing logs that may contain tokens or command output from private
  projects
- prefer PNG screenshots under `assets/`
- keep GIFs short and below GitHub's comfortable rendering size

Suggested filenames:

- `assets/screenshot-menu.png`
- `assets/screenshot-settings.png`
- `assets/screenshot-queue.png`
- `assets/screenshot-cleanup.png`
