# Contributing

Thanks for helping improve Codex Telegram Bot.

## Local Setup

```bash
npm install
cp .env.minimal.example .env
```

Fill in your local Telegram and Codex settings in `.env`.

## Development Checks

Run these before opening a pull request:

```bash
npm run check
npm test
```

## Pull Requests

- Keep changes focused.
- Do not commit `.env`, tokens, runtime `state/`, backups, uploads, or Codex
  session files.
- Update `README.md`, `README.ko.md`, or docs when behavior changes.
- Add or update tests for command parsing, queue behavior, formatting, or other
  user-visible behavior.

## Release Notes

User-visible changes should be added to `CHANGELOG.md`.
