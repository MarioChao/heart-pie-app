import 'dotenv/config';
import { verifyKey } from 'discord-interactions';

// Combined from discord-example-app and cloudflare-sample-app
export async function VerifyDiscordRequest(request, env) {
	const signature = request.headers.get('X-Signature-Ed25519');
	const timestamp = request.headers.get('X-Signature-Timestamp');
	const body = await request.text();
	const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

export async function DiscordRequest(endpoint, options) {
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
		console.log(res.status);
		throw new Error(JSON.stringify(data));
	}

	// return original response
	return res;
}

export async function InstallGlobalCommands(appId, commands) {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${appId}/commands`;

	try {
		// This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		const response = await DiscordRequest(endpoint, { method: 'PUT', body: commands });
		console.log('Registered all commands');
	} catch (err) {
		console.error(err);
	}
}

export function contextWaitUntil(context, callback) {
	const promise = new Promise(async (resolve, reject) => {
		try {
			await callback();
			resolve(1);
		} catch {
			reject("Failed");
		}
	});
	context.waitUntil(promise);
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
	const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
	return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
