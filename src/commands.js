// Registering commands

// Run from the command line

// Imports

import dotenv from 'dotenv';
import { getRPSChoices } from './scripts/rps-game.js';
import { functionModule as epicDepartment } from './scripts/epic-department.js';
import { capitalize, InstallGlobalCommands } from './scripts/utils.js';

// Local environment

dotenv.config({ path: '.dev.vars' });

// Constants

const usernameOption = {
	type: 3,
	name: 'username',
	description: 'Player username on Roblox (any if you use user_id)',
	required: true,
	max_length: 50,
	autocomplete: true,
};
const userIdOption = {
	type: 4,
	name: 'user_id',
	description: 'Player userId on Roblox',
	required: false,
	min_value: 1,
	autocomplete: true,
};

// Create command choices from array
function createCommandChoices(choiceArray) {
	const choices = choiceArray;
	const commandChoices = [];

	for (const choice of choices) {
		commandChoices.push({
			name: capitalize(choice),
			value: choice,
		});
	}

	return commandChoices;
}

// Test command
const TEST_COMMAND = {
	name: 'test',
	description: 'Basic command',
	type: 1,
};

// RPS command containing options
const RPS_COMMAND = {
	name: 'challenge_rps',
	description: 'Challenge others to a match of rock paper scissors',
	options: [
		{
			type: 3,
			name: 'object',
			description: 'Pick your object',
			required: true,
			choices: createCommandChoices(getRPSChoices()),
		},
	],
	type: 1,
};

// Encoding commands
const ENCODE_COMMAND = {
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
	type: 1,
};

const DECODE_COMMAND = {
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
	type: 1,
};

// Pie commands
const PIEHIKE_COMMAND = {
	name: 'hike',
	description: 'Find a random pie hike challenge',
	type: 1,
};

const PIEHIKEALL_COMMAND = {
	name: 'hikeall',
	description: 'List out the possible pie hike challenges',
	type: 1,
};

const PIEBAKE_COMMAND = {
	name: 'bake',
	description: 'Bake a random pie',
	type: 1,
};

const GETPIES_COMMAND = {
	type: 1,
	name: 'getpies',
	description: 'Get the pies that a player owns',
	options: [
		usernameOption,
		userIdOption,
	],
};

// Epic Department commands
const UNIVERSEID_COMMAND = {
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

const BADGES_COMMAND = {
	type: 1,
	name: 'checkbadges',
	description: 'Check a player\'s owned badges in a game',
	options: [
		{
			type: 1,
			name: 'game_name',
			description: 'Check a player\'s owned badges in a game by name',
			options: [
				{
					type: 3,
					name: 'game_name',
					description: 'Name of the game to get info from',
					required: true,
					choices: createCommandChoices(epicDepartment.gameNames),
				},
				usernameOption,
				userIdOption,
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
				usernameOption,
				userIdOption,
			],
		},
	],
};

// Install commands globally
const ALL_COMMANDS = [ENCODE_COMMAND, DECODE_COMMAND,
	PIEHIKE_COMMAND, PIEHIKEALL_COMMAND, PIEBAKE_COMMAND, GETPIES_COMMAND,
	UNIVERSEID_COMMAND, BADGES_COMMAND];

InstallGlobalCommands(process.env.DISCORD_APPLICATION_ID, ALL_COMMANDS);
