// Imports
import { env } from "cloudflare:workers";
import { functionModule as robloxFetchApi } from './roblox-fetch.js';

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
 * @param {{username: string?, userId: number?}} playerInfo 
 * @returns The corrected playerInfo with matching username and userId.
 */
export async function validatePlayerInfo(playerInfo) {
	// Get player information
	let username = playerInfo.username;
	let userId = playerInfo.userId;
	if (!userId || userId < 1) {
		// Get player userId
		try {
			console.log(`[utils]: Fetching user id for '${username}'.`);
			await tryRetry(async () => {
				userId = await robloxFetchApi.fetchUserId(username);
			}, 3, 50);
		} catch (error) {
			throw error;
		}
	}
	
	// Get player username
	let player;
	try {
		console.log(`[utils]: Fetching username for user id ${userId}.`);
		await tryRetry(async () => {
			player = await robloxFetchApi.fetchPlayer(userId);
		}, 3, 50);
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

export function printEnvKeynames() {
	let envKeynames = [];
	for (const str of Object.keys(env)) {
		envKeynames.push(str);
	}
	console.log(`[utils]: Env keynames: ${envKeynames.join(',')}`);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to automatically retry calls when error occurs.
// Syntax: await tryRetry(async () => { ... }, 3, 50);
export async function tryRetry(callback, maxTrials, retryDelayMs) {
	let trial = 1;
	let isSuccessful = false;
	let resultError = null;
	while (trial <= maxTrials) {
		try {
			await callback()
			isSuccessful = true;
			console.log(`[utils]: Try-retry #${trial} successful.`)
			break;
		} catch (error) {
			resultError = error;
		}
		console.log(`[utils]: Try-retry #${trial} failed.`)
		trial++;
		if (trial < maxTrials) {
			await delay(retryDelayMs);
		}
	}
	if (isSuccessful === false) {
		throw resultError;
	}
}

