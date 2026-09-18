// Imports
import 'dotenv/config';
import {
	verifyKey,
	MessageComponentTypes,
	ButtonStyleTypes,
	TextStyleTypes,
} from "discord-interactions";

// Combined from discord-example-app and cloudflare-sample-app
async function VerifyDiscordRequest(request, env) {
	const signature = request.headers.get('X-Signature-Ed25519');
	const timestamp = request.headers.get('X-Signature-Timestamp');
	const body = await request.text();
	const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

async function DiscordRequest(endpoint, options) {
	// append endpoint to root API URL
	const url = 'https://discord.com/api/v10/' + endpoint;

	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);

	// Use fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json; charset=UTF-8',
		},
		...options
	});

	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		console.log("[utils]: Discord request failed.");
		console.log(res.status);
		throw new Error(JSON.stringify(data));
	}

	// return original response
	return res;
}

async function InstallGlobalCommands(appId, commands) {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${appId}/commands`;

	try {
		// This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		const response = await DiscordRequest(endpoint, { method: 'PUT', body: commands });
		console.log('[utils]: Registered all commands.');
	} catch (err) {
		console.error(err);
	}
}

// Create command choices from array
function createCommandChoicesFromArray(choiceArray) {
	return choiceArray.map((choice) => ({name: choice, value: choice}));
}

// Simple method that returns a random emoji from list
function getRandomEmoji() {
	const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
	return emojiList[Math.floor(Math.random() * emojiList.length)];
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const utils = {
    VerifyDiscordRequest,
    DiscordRequest,
    InstallGlobalCommands,
	createCommandChoicesFromArray,
	getRandomEmoji,
	capitalize,
};

export {utils};
