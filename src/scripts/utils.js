// Imports
import 'dotenv/config';
import {
	verifyKey,
	MessageComponentTypes,
	ButtonStyleTypes,
	TextStyleTypes,
} from "discord-interactions";
import { functionModule as robloxFetchApi } from './roblox-fetch.js';

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

export function createButtonComponent(label, customId, disabled, buttonStyle = ButtonStyleTypes.SECONDARY) {
	const component = {
		type: MessageComponentTypes.BUTTON,
		style: buttonStyle,
		label,
		custom_id: customId,
		disabled,
	};
	return component;
}

export function createTextInputComponent(label, customId, required) {
	const component = {
		type: MessageComponentTypes.INPUT_TEXT,
		style: TextStyleTypes.SHORT,
		label,
		custom_id: customId,
		required,
	};
	return component;
}

export function createPagesActionRowComponent(page, pageCount, buttonIdText, replacePattern = "$") {
	const regex = new RegExp(replacePattern, "g");
	const initialComponents = [
		createButtonComponent("1", buttonIdText.replace(regex, "1.0"), page == 1),
		createButtonComponent("◀", buttonIdText.replace(regex, `${page - 1}`), page <= 1),
		createButtonComponent("...", buttonIdText.replace(regex, "search")),
		createButtonComponent("▶", buttonIdText.replace(regex, `${page + 1}`), page >= pageCount),
		createButtonComponent(`${pageCount}`, buttonIdText.replace(regex, `${pageCount}.0`), page == pageCount),
	];

	const finalComponent = {
		type: MessageComponentTypes.ACTION_ROW,
		components: initialComponents,
	};

	return finalComponent;
}


export function contextWaitUntil(context, callback) {
	const promise = new Promise(async (resolve, reject) => {
		try {
			await callback();
			resolve(1);
		} catch {
			console.error("Error sending message:", error);
			reject("Failed");
		}
	});
	context.waitUntil(promise);
}

/**
 * 
 * @param {{username: string, userId: number?}} playerInfo 
 * @returns The corrected playerInfo with matching username and userId
 */
export async function validatePlayerInfo(playerInfo) {
	// Get player information
	let username = playerInfo.username;
	let userId = playerInfo.userId;
	if (!userId) {
		// Get player userId
		try {
			userId = await robloxFetchApi.fetchUserId(username);
		} catch (error) {
			throw error;
		}
	}
	
	// Get player username
	let player;
	try {
		player = await robloxFetchApi.fetchPlayer(userId);
	} catch (error) {
		throw error;
	}
	username = player.name;

	// Return
	return {username, userId}
}

/**
 * 
 * @param {{string: [any]}} requirements 
 * @param {{string: {any: boolean}}} statistics 
 * @returns Whether the provided statistics satisfy the given requirements
 */
export function checkMeetRequirements(requirements, statistics) {
	for (const [key, values] of Object.entries(requirements)) {
		// No stat
		const stat = statistics[key];
		if (!stat) {
			// Check if requirement is empty
			if (values.length == 0) {
				continue;
			} else {
				return false;
			}
		}

		// Meet requirement
		for (const value of values) {
			if (stat[value] !== true) {
				return false;
			}
		}
	}
	return true;
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
	const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
	return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
