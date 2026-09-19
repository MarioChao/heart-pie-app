# Changelogs

## [v1.0.3] Listbadges badge packs + EPDP pack | 2026/09/19

Added `badge_pack` subcommand for `listbadges`.

Added a badge pack (Epic Department).

When universe name fetching fails, a backup name can be returned if the place id is stored in [game-data.js](./src/command-scripts/game-data.js).

Refactored & simplified parts of [epic-department.js](./src/scripts/epic-department.js).

## [v1.0.2] Autocomplete choices | 2026/09/18

Added autocomplete choices for `game_name` and `badge_pack` parameters:
- Enables more than 25 choices to be selected through autocomplete.

Added more game names:
- \> home, Abyss World, Detachment: Reimagined, Gears, Incessant Dream,
- Isolarium, NEON MILKBOX, Nullscape, Pressure, RBLX: Dream Emulator,
- STATION, The Qoppa Epistles, "To The Sky, I Leave My Name"

## [v1.0.1] Badge packs + UserId / Username field swap | 2026/09/13

Added a `badge_pack` subcommand for `checkbadges`.
- Badge packs are hardcoded as a list of objects with `id` and `name` field, thus removing the need to do additional fetches.

Added a badge pack (Pie Hiking Badger).

Swapped the userId & username fields for each command (`getpies`, `checkbadges`, `listbadges`).

Fixed `node ./src/commands.js` not able to run due to the use of `cloudflare:workers`.

## [v1.0.0] Detailed logs + Fixed badge check | 2026/06/11

Added detailed log statements (debug) and error results (discord app).

Fixed badge checking commands (`checkbadges` & `getpies`) using [API keys](https://create.roblox.com/docs/cloud/auth/api-keys).

Fixed getting environment variables using [`cloudflare:workers`](https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global).

Added new `getuserid` command.
