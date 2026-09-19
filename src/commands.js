// Registering commands

/**
 * Run from the command line
 * - "node ./src/commands.js"
 * 
 * More about commands: https://docs.discord.com/developers/interactions/application-commands#application-command-object
 */

// Imports

import dotenv from 'dotenv';
import { getRPSChoices } from './scripts/rps-game.js';
import { utils } from './command-scripts/utils.js';
import { gameData } from './command-scripts/game-data.js';

// Local environment

dotenv.config({ path: '.dev.vars' });

// Constants

const usernameOption = {
	type: 3,
	name: 'username',
	description: 'Player username on Roblox',
	required: false,
	max_length: 50,
};
const userIdOption = {
	type: 4,
	name: 'user_id',
	description: 'Player userId on Roblox (enter 0 to use username)',
	required: true,
	min_value: 0,
};

// Test command
const TEST_COMMAND = {
	type: 1,
	name: 'test',
	description: 'Basic command',
};

// RPS command containing options
const RPS_COMMAND = {
	type: 1,
	name: 'challenge_rps',
	description: 'Challenge others to a match of rock paper scissors',
	options: [
		{
			type: 3,
			name: 'object',
			description: 'Pick your object',
			required: true,
			choices: utils.createCommandChoicesFromArray(getRPSChoices()),
		},
	],
};

// Encoding commands
const ENCODE_COMMAND = {
	type: 1,
	name: 'encode',
	description: 'Encode a message using base64',
	options: [
		{
			type: 3,
			name: 'message',
			description: 'Input plaintext',
			required: true,
		}
	],
};

const DECODE_COMMAND = {
	type: 1,
	name: 'decode',
	description: 'Decode a base64 message',
	options: [
		{
			type: 3,
			name: 'ciphertext',
			description: 'Input ciphertext',
			required: true,
		}
	],
};

// Pie commands
const PIEHIKE_COMMAND = {
	name: 'hike',
	description: 'Find a random pie hike challenge',
	type: 1,
};

const PIEHIKEALL_COMMAND = {
	type: 1,
	name: 'hikeall',
	description: 'List out the possible pie hike challenges',
};

const PIEBAKE_COMMAND = {
	type: 1,
	name: 'bake',
	description: 'Bake a random pie',
};

const GETPIES_COMMAND = {
	type: 1,
	name: 'getpies',
	description: 'Get the pies that a player owns',
	options: [
		userIdOption,
		usernameOption,
	],
};

// Epic Department commands
const UNIVERSE_ID_COMMAND = {
	type: 1,
	name: 'getuniverseid',
	description: 'Get the universe id of a Roblox place',
	options: [
		{
			type: 4,
			name: 'place_id',
			description: "The game's place id",
			required: true,
		}
	]
}

const USER_ID_COMMAND = {
	type: 1,
	name: 'getuserid',
	description: "Get a player's user id from username",
	options: [
		{
			type: 3,
			name: 'username',
			description: "The player's username",
			required: true,
		}
	]
}

const CHECK_BADGES_COMMAND = {
	type: 1,
	name: 'checkbadges',
	description: 'Check a player\'s owned badges in a game',
	options: [
		{
			type: 1,
			name: 'badge_pack',
			description: 'Check a player\'s owned badges from a badge pack',
			options: [
				{
					type: 3,
					name: 'badge_pack',
					description: 'Name of the badge pack',
					required: true,
					autocomplete: true,
				},
				userIdOption,
				usernameOption,
			],
		},
		{
			type: 1,
			name: 'game_name',
			description: 'Check a player\'s owned badges in a game by name',
			options: [
				{
					type: 3,
					name: 'game_name',
					description: 'Name of the game',
					required: true,
					autocomplete: true,
				},
				userIdOption,
				usernameOption,
			],
		},
		{
			type: 1,
			name: 'place_id',
			description: "Check a player\'s owned badges in a game by place id",
			options: [
				{
					type: 4,
					name: 'place_id',
					description: "The game's place id",
					required: true,
				},
				userIdOption,
				usernameOption,
			],
		},
	],
};

const LIST_BADGES_COMMAND = {
	type: 1,
	name: 'listbadges',
	description: "List out the badges of a game",
	options: [
		{
			type: 1,
			name: 'badge_pack',
			description: 'List out the badges of a badge pack',
			options: [
				{
					type: 3,
					name: 'badge_pack',
					description: 'Name of the badge pack',
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			type: 1,
			name: 'game_name',
			description: 'List out the badges of a game by name',
			options: [
				{
					type: 3,
					name: 'game_name',
					description: 'Name of the game',
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			type: 1,
			name: 'place_id',
			description: "List out the badges of a game by place id",
			options: [
				{
					type: 4,
					name: 'place_id',
					description: "The game's place id",
					required: true,
				},
			],
		},
	],
};

// Install commands globally
const ALL_COMMANDS = [
	ENCODE_COMMAND, DECODE_COMMAND,
	PIEHIKE_COMMAND, PIEHIKEALL_COMMAND, PIEBAKE_COMMAND, GETPIES_COMMAND,
	UNIVERSE_ID_COMMAND, USER_ID_COMMAND,
	CHECK_BADGES_COMMAND, LIST_BADGES_COMMAND
];

utils.InstallGlobalCommands(process.env.DISCORD_APPLICATION_ID, ALL_COMMANDS);
