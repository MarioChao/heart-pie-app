// Roblox fetch script

// Imports
import { env } from "cloudflare:workers";
import { functionModule as fetchApi } from "./fetch-api.js";
import { tryRetry } from "./utils.js";

// Constants

const badgesPerFetch = 100; // 10, 25, 50, 100
const reFetchMinutes = 1;

const universeBadgesCache = {};

// Apis functions

/**
 * 
 * @param {number} placeId A Roblox place id
 * @returns The universe id of the Roblox place
 */
async function fetchUniverseId(placeId) {
	// Set up api
	const apiUrl = `https://apis.roblox.com/universes/v1/places/${placeId}/universe`;

	// Fetch data
	let data;
	try {
		data = await fetchApi.fetchUrl(apiUrl);
	} catch (error) {
		throw error;
	}
	return data.universeId;
}

// Games api functions

/**
 * 
 * @param {number} universeId A Roblox universe id
 * @returns The name of the universe's starter place
 */
async function fetchUniverseName(universeId) {
	// Set up api
	const apiUrl = `https://games.roblox.com/v1/games`;
	const urlParams = new URLSearchParams();
	urlParams.set("universeIds", universeId);

	// Fetch data
	let universeData;
	try {
		const data = await fetchApi.fetchUrl(apiUrl, urlParams);
		universeData = data.data[0];
	} catch (error) {
		throw error;
	}
	return universeData.name;
}

// Badge api functions

/**
 * 
 * @param {number} universeId A Roblox universe id
 * @returns All badges in a universe
 */
async function _fetchBadges(universeId) {
	// Set up api
	const apiUrl = `https://badges.roblox.com/v1/universes/${universeId}/badges`;
	const urlParams = new URLSearchParams();
	urlParams.set("limit", badgesPerFetch);
	urlParams.set("cursor", "");
	urlParams.set("sortOrder", "Asc");

	// Look through pages
	let data;
	const badgeList = [];
	try {
		data = await fetchApi.fetchUrl(apiUrl, urlParams);
	} catch (error) {
		throw error;
	}
	while (true) {
		// Add badges to list
		let pageBadgeList = data.data;
		for (const badge of pageBadgeList) {
			badgeList.push(badge);
		}
		console.log(`[roblox-fetch]: Fetched badges: ${badgeList.length}.`);

		// Next page
		let nextPageCursor = data.nextPageCursor;
		if (nextPageCursor == null) {
			break;
		}
		urlParams.set("cursor", nextPageCursor);
		try {
			data = await fetchApi.fetchUrl(apiUrl, urlParams);
		} catch (error) {
			throw error;
		}
	}

	// Return all badges
	return badgeList;
}

/**
 * 
 * @param {number} universeId A Roblox universe id
 * @returns All cached badges in a universe, refetched every 10 minutes for each universe
 */
async function fetchBadgesByUniverseId(universeId) {
	// Memoize
	let willFetch = false;
	if (universeBadgesCache[universeId] == null) {
		universeBadgesCache[universeId] = {};
		willFetch = true;
	} else {
		let previousTime = universeBadgesCache[universeId].time;
		let elapsedMs = Date.now() - previousTime;
		if (elapsedMs > reFetchMinutes * 60 * 1000) {
			willFetch = true;
		}
	}

	// Fetch if needed
	if (willFetch) {
		try {
			universeBadgesCache[universeId].time = Date.now();
			universeBadgesCache[universeId] = {
				badges: await _fetchBadges(universeId),
				time: Date.now(),
			}
		} catch (error) {
			throw error;
		}
	}

	// Return badges
	return universeBadgesCache[universeId].badges;
}

/**
 * 
 * @param {number} userId A player user id
 * @param {[number]} badgeIds A list of Roblox badge ids
 * @returns The info and dates of the badges that the player owns from the given badges
 */
async function fetchBadgeAwardedDates_unused(userId, badgeIds) {
	// Set up api
	const apiUrl = `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates`;
	const urlParams = new URLSearchParams();

	// Fetch 100 badges (limit) at a time
	const badgeAwardedDates = [];
	for (let i = 0; i < badgeIds.length; i += 100) {
		// Set url params
		urlParams.set("badgeIds", badgeIds.slice(i, i + 100).join(","));
	
		// Fetch data
		let data;
		try {
			data = await fetchApi.fetchUrl(apiUrl, urlParams);
		} catch (error) {
			throw error;
		}
		const awardedDates = data.data;
		for (const badge of awardedDates) {
			badgeAwardedDates.push(badge);
		}
	}

	// Return awarded dates
	return badgeAwardedDates;
}

/**
 * 
 * @param {number} userId A player user id
 * @param {[number]} badgeIds A list of Roblox badge ids
 * @returns The info of the badges that the player owns from the given badges
 */
async function fetchInventoryBadges(userId, badgeIds) {
	console.log(`[roblox-fetch]: Called fetchInventoryBadges.`);

	// Get api key
	const apiKey = env.READ_INVENTORY_KEY_1;
	if (!apiKey) {
		console.log('[roblox-fetch]: No api key found!');
		throw new Error('Missing api key.');
	}

	// Set up api
	const apiUrl = `https://apis.roblox.com/cloud/v2/users/${userId}/inventory-items`;
	const urlParams = new URLSearchParams();
	const requestOptions = {
		headers: {
			"x-api-key": apiKey,
		}
	};

	// Fetch 100 badges (limit) at a time
	const ownedBadges = [];
	console.log(`[roblox-fetch]: Fetching inventory badges...`);
	console.log(`[roblox-fetch]: Api key: ${String(apiKey).substring(0, 3)}...`);
	for (let i = 0; i < badgeIds.length; i += 100) {
		// Set url params
		const badgeIdsString = badgeIds.slice(i, i + 100).join(",");
		const filterString = `badgeIds=${badgeIdsString}`;
		urlParams.set("maxPageSize", 100);
		urlParams.set("filter", filterString);
	
		// Fetch data
		let data;
		try {
			data = await fetchApi.fetchUrl(apiUrl, urlParams, requestOptions);
		} catch (error) {
			throw error;
		}
		const fetchResult = data.inventoryItems;
		for (const badge of fetchResult) {
			ownedBadges.push(badge);
		}
	}
	console.log(`[roblox-fetch]: Done fetching inventory badges!`);

	// Return awarded dates
	return ownedBadges;
}

/**
 * 
 * @param {number} userId A player user id
 * @param {[number]} badgeIds A list of Roblox badge ids
 * @returns The list of badge ids that the player owns from the given badges
 */
async function fetchAwardedBadgeIds(userId, badgeIds) {
	console.log(`[roblox-fetch]: Called fetchAwardedBadgeIds.`);

	let awardedBadgeIds = [];
	try {
		// Fetch owned badges
		const ownedBadges = await fetchInventoryBadges(userId, badgeIds);

		// Get badge ids
		ownedBadges.forEach((value) => {
			awardedBadgeIds.push(parseInt(value.badgeDetails.badgeId));
		});
	} catch (error) {
		throw error;
	}
	return awardedBadgeIds
}

// Users api functions

/**
 * 
 * @param {number} userId A player user id
 * @returns Information about a player
 */
async function fetchPlayer(userId) {
	// Set up api
	const apiUrl = `https://users.roblox.com/v1/users/${userId}`;

	// Fetch player data
	let data;
	try {
		data = await fetchApi.fetchUrl(apiUrl);
	} catch (error) {
		throw error;
	}
	return data;
}

/**
 * 
 * @param {[string]} usernames A list of player usernames
 * @returns The corresponding list of user information
 */
async function fetchUsers(usernames) {
	// Set up api
	const apiUrl = `https://users.roblox.com/v1/usernames/users`;
	const requestOptions = {
		method: "POST",
		body: JSON.stringify({
			"usernames": usernames,
			"excludeBannedUsers": true,
		}),
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
		},
	};
	console.log(`[roblox-fetch]: Fetching usernames for '${usernames.join(', ')}'.`);

	// Fetch users data
	let data;
	try {
		await tryRetry(async () => {
			data = await fetchApi.fetchUrl(apiUrl, null, requestOptions);
		}, 3, 50);
	} catch (error) {
		throw error;
	}
	return data;
}

/**
 * 
 * @param {string} username A player username
 * @returns The player's user id
*/
async function fetchUserId(username) {
	let userId;
	try {
		// Fetch user
		const users = await fetchUsers([username.toString()]);
		const user = users.data[0];
		
		// Get user id
		userId = user.id;
	} catch (error) {
		throw error;
	}
	return userId;
}

// Function module
const functionModule = {
	fetchUniverseId,
	fetchUniverseName,
	fetchBadgesByUniverseId,
	fetchInventoryBadges,
	fetchAwardedBadgeIds,
	fetchPlayer,
	fetchUsers,
	fetchUserId,
};

export { functionModule };
