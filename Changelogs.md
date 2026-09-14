# Changelogs

## [v1.0.1] Badge packs + UserId / Username field swap | 2026/09/13

Added a `badge_pack` subcommand for `checkbadges`.
- Badge packs are hardcoded as a list of objects with `id` and `name` field, thus removing the need to do additional fetches.

Swapped the userId & username fields for each command (`getpies`, `checkbadges`, `listbadges`).

Fixed `node ./src/commands.js` not able to run due to the use of `cloudflare:workers`.

## [v1.0.0] Detailed logs + Fixed badge check | 2026/06/11

Added detailed log statements (debug) and error results (discord app).

Fixed badge checking commands (`checkbadges` & `getpies`) using [API keys](https://create.roblox.com/docs/cloud/auth/api-keys).

Fixed getting environment variables using [`cloudflare:workers`](https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global).

Added new `getuserid` command.
