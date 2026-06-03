# Rollback

Use this runbook when a release breaks startup, Telegram command handling, Codex
turn execution, image handling, queue state, or cleanup behavior.

## Checklist

- [ ] Identify the previous release tag or rollback commit.
- [ ] Back up the current `.env` and `state/` outside Git.
- [ ] Back up any custom systemd unit override.
- [ ] Stop or restart the service only after the backup exists.
- [ ] Restore the previous package version, or run `git checkout <rollback-ref>`.
- [ ] Run the install command required by that version, usually
  `npm ci --omit=dev`.
- [ ] Run `systemctl --user restart codex-telegram-bot.service`.
- [ ] Confirm `systemctl --user is-active codex-telegram-bot.service` returns
  `active`.
- [ ] Run `/health`.
- [ ] Confirm identity and authorization with `/whoami`.
- [ ] Confirm queue and state behavior with `/queue`, `/status`, and one small
  text turn.
- [ ] Inspect
  `journalctl --user -u codex-telegram-bot.service --since "10 minutes ago"`.

## Package Rollback

For global installs:

```bash
npm install --global github:woosungchoi/codex-telegram-bot#<tag-or-commit>
systemctl --user restart codex-telegram-bot.service
```

For a local checkout:

```bash
git fetch --tags origin
git checkout <tag-or-commit>
npm ci --omit=dev
systemctl --user restart codex-telegram-bot.service
```

## State Rollback

Keep rollback backups outside the repository because they can contain secrets,
chat ids, queued prompts, image paths, and private Codex thread references.

If state migration or queue persistence caused the fault, restore the backed-up
`state/` directory before restarting the service. If only application code
failed, prefer keeping the newest state and rolling back the package first.

## Notes

- If no release tag exists, use the last known good commit hash from `git log`.
- If Telegram polling conflicts appear in logs, verify that only one service or
  process is polling the same bot token.
- If image handling caused the rollback, inspect `UPLOAD_DIR` and run only the
  dry-run `/cleanup_uploads` command until the service is stable.
