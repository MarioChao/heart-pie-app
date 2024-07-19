// Registering commands

// Run from the command line

import dotenv from 'dotenv';
import { getRPSChoices } from './scripts/rps-game.js';
import { functionModule as epicDepartment } from './scripts/epic-department.js';
import { capitalize, InstallGlobalCommands } from './scripts/utils.js';

dotenv.config({ path: '.dev.vars' })

// Create command choices from array
function createCommandChoices(choiceArray) {
	const choices = choiceArray;
	const commandChoices = [];

	for (let choice of choices) {
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
}

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
}

// Pie commands
const PIEHIKE_COMMAND = {
	name: 'hike',
	description: 'Find a random pie hike challenge',
	type: 1,
}

const PIEHIKEALL_COMMAND = {
	name: 'hikeall',
	description: 'List out the possible pie hike challenges',
	type: 1,
}

const PIEBAKE_COMMAND = {
	name: 'bake',
	description: 'Bake a random pie',
	type: 1,
}

// Epic Department commands
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
				{
					type: 3,
					name: 'username',
					description: 'Player username on Roblox (any if you use user_id)',
					required: true,
					max_length: 50,
					autocomplete: true,
				},
				{
					type: 4,
					name: 'user_id',
					description: 'Player userId on Roblox',
					required: false,
					min_value: 1,
					autocomplete: true,
				},
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
				{
					type: 3,
					name: 'username',
					description: 'Player username on Roblox (any if you use user_id)',
					required: true,
					max_length: 50,
					autocomplete: true,
				},
				{
					type: 4,
					name: 'user_id',
					description: 'Player userId on Roblox',
					required: false,
					min_value: 1,
					autocomplete: true,
				},
			],
		},
	],
}

// Install commands globally
const ALL_COMMANDS = [TEST_COMMAND, RPS_COMMAND, ENCODE_COMMAND, DECODE_COMMAND,
	PIEHIKE_COMMAND, PIEHIKEALL_COMMAND, PIEBAKE_COMMAND, BADGES_COMMAND];

InstallGlobalCommands(process.env.DISCORD_APPLICATION_ID, ALL_COMMANDS);
