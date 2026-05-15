# Security Model

This bot is designed for a trusted personal or small-team Telegram chat, not for
public anonymous access.

## Trust Boundaries

- Telegram users are trusted only after their numeric id is listed in
  `ALLOWED_USER_IDS`.
- Codex can read or write according to the configured sandbox and approval
  policy.
- Runtime state and Codex sessions are local files and may contain private
  content.
- GitHub Actions secrets are available only according to GitHub's event rules.

## Codex OAuth in GitHub Actions

The public workflows use `CODEX_ACCESS_TOKEN` only when configured as a
repository secret. They do not call OpenAI APIs directly and do not require
`OPENAI_API_KEY`.

Pull requests from forks normally cannot access repository secrets. In that
case, Codex review and diagnosis steps skip while normal CI still runs.

## Telegram Safety

- Keep `ALLOWED_USER_IDS` narrow.
- Treat Telegram as a command surface for the machine running the bot.
- Avoid `danger-full-access` unless the host is disposable or tightly isolated.
- Use `/settings` and `/tools` to inspect active sandbox, approval, queue, and
  maintenance state.

## Data Handling

The bot may store:

- chat preferences
- queue data
- downloaded image inputs
- cleanup manifests
- backups
- Codex thread ids and session references

Keep `state/`, upload directories, backups, and Codex session directories out of
Git. Before sharing logs, redact tokens, chat ids, paths, and private prompts.
