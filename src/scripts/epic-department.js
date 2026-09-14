// Imports
import { functionModule as robloxFetchApi } from './roblox-fetch.js';
import { tryRetry, validatePlayerInfo } from './utils.js';
import { successColor, fieldValueLimit, createFailBody } from './embed-constants.js';

// Constants

const reFetchMinutes = 1;
const universeBadgeFieldsCache = {};
console.log("[epic-department]: Restart.");

// Local functions

async function _createBadgeFields(universeId) {
	// Get game badges
	let gameBadges;
	try {
		gameBadges = await robloxFetchApi.fetchBadgesByUniverseId(universeId);
	} catch (error) {
		throw error;
	}

	// Sort array
	gameBadges.sort((a, b) => {
		return a.name > b.name ? 1 : -1;
	});

	// Create badge list texts
	let embedText = "";
	const storedFields = [];
	for (let i = 0; i < gameBadges.length; i++) {
		// Generate info
		const badge = gameBadges[i];
		let badgeUrl = `https://roblox.com/badges/${badge.id}`;
		let addText = `\n[${badge.name}](${badgeUrl})`;

		// Check overflow
		if (embedText.length + addText.length > fieldValueLimit) {
			// Push field
			storedFields.push({
				name: `Badges (${gameBadges.length})`,
				value: embedText,
				inline: true,
			});
			embedText = "";
		}

		// Update text
		embedText += addText;
	}
	// Push final field
	storedFields.push({
		name: `Badges (${gameBadges.length})`,
		value: embedText,
		inline: true,
	});

	// Return
	return storedFields;
}

async function getBadgeFields(universeId) {
	// Memoize
	let willFetch = false;
	if (universeBadgeFieldsCache[universeId] == null) {
		universeBadgeFieldsCache[universeId] = {};
		willFetch = true;
	} else {
		let previousTime = universeBadgeFieldsCache[universeId].time;
		let elapsedMs = Date.now() - previousTime;
		if (elapsedMs > reFetchMinutes * 60 * 1000) {
			willFetch = true;
		}
	}

	// Fetch if needed
	if (willFetch) {
		try {
			universeBadgeFieldsCache[universeId].time = Date.now();
			universeBadgeFieldsCache[universeId] = {
				fields: await _createBadgeFields(universeId),
				time: Date.now(),
			}
		} catch (error) {
			throw error;
		}
	}

	// Return fields
	return universeBadgeFieldsCache[universeId].fields;
}

// Command functions
async function getUniverseId(inputPlaceId) {
	let universeId;
	try {
		const placeId = parseInt(inputPlaceId);
		console.log(`[epic-department]: Fetching universe id for ${placeId}.`);
		universeId = await robloxFetchApi.fetchUniverseId(placeId);
		console.log(`[epic-department]: Fetched result: ${universeId}.`);
	} catch (error) {
		return "Failed request :(";
	}
	return universeId;
}

async function getUserId(inputUsername) {
	let userId;
	try {
		console.log(`[epic-department]: Fetching user id for '${inputUsername}'.`);
		userId = await robloxFetchApi.fetchUserId(inputUsername);
		console.log(`[epic-department]: Fetched result: ${userId}.`);
	} catch (error) {
		return "Failed request :(";
	}
	return userId;
}

async function getAwardedUnawardedBadges(gameBadges, userId) {
	// Get badges awarded to player
	const gameBadgeIds = []
	for (const badge of gameBadges) {
		gameBadgeIds.push(badge.id);
	}
	let awardedBadgeIds;
	try {
		await tryRetry(async () => {
			awardedBadgeIds = await robloxFetchApi.fetchAwardedBadgeIds(userId, gameBadgeIds);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting awarded badges.");
	}
	console.log(`[epic-department]: Got awarded badges.`);

	// Sort arrays
	awardedBadgeIds.sort((a, b) => {
		return a > b ? 1 : -1;
	});
	gameBadges.sort((a, b) => {
		return a.id > b.id ? 1 : -1;
	});

	// Get awarded & not awarded badges
	const awardedBadges = [];
	const unawardedBadges = [];
	let i0 = 0;
	let i1 = 0;
	while (i0 < gameBadges.length && i1 < awardedBadgeIds.length) {
		const gameBadge = gameBadges[i0];
		const awardedBadgeId = awardedBadgeIds[i1];
		if (gameBadge.id == awardedBadgeId) {
			awardedBadges.push(gameBadge);
			i0++;
			i1++;
		} else {
			unawardedBadges.push(gameBadge);
			i0++;
		}
	}
	while (i0 < gameBadges.length) {
		unawardedBadges.push(gameBadges[i0]);
		i0++;
	}
	return {awardedBadges, unawardedBadges};
}

async function checkBadges(resultTitle, gameBadges, playerInfo) {
	// Get player information
	try {
		await tryRetry(async () => {
			playerInfo = await validatePlayerInfo(playerInfo);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting player information.");
	}
	const username = playerInfo.username;
	const userId = playerInfo.userId;
	console.log(`[epic-department]: 1: Got player info.`);

	// Get awarded & unawarded badges
	const {awardedBadges, unawardedBadges} = await getAwardedUnawardedBadges(gameBadges, userId);
	console.log(`[epic-department]: 2: Got awarded & unawarded badges.`);

	// Create awarded text
	let awardedText = "";
	for (const badge of awardedBadges) {
		let addText = `\n${badge.name}`;
		if (awardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		awardedText += addText;
	}
	const awardedEmbedField = {
		name: `Awarded Badges (${awardedBadges.length})`,
		value: awardedText,
		inline: true,
	};
	
	// Create unawarded text
	let unawardedText = "";
	for (const badge of unawardedBadges) {
		let addText = `\n${badge.name}`;
		if (unawardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		unawardedText += addText;
	}
	const unawardedEmbedField = {
		name: `Unawarded Badges (${unawardedBadges.length})`,
		value: unawardedText,
		inline: true,
	};

	console.log(
		`[epic-department]: Check badges result:\n` +
		`Text lengths (awarded & unawarded): ${awardedText.length}, ${unawardedText.length}\n` +
		`Awarded badges ratio: ${awardedBadges.length} / ${gameBadges.length}`
	);

	// Create result body
	const resultEmbed = {
		title: `${resultTitle}`,
		color: successColor,
		fields: [awardedEmbedField, unawardedEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Badge info for [${username}](<https://www.roblox.com/users/${userId}>)`,
		embeds: resultEmbeds,
	}

	return resultBody;
}

async function checkBadgesByPlaceId(inputPlaceId, playerInfo) {
	// Get player information
	try {
		await tryRetry(async () => {
			playerInfo = await validatePlayerInfo(playerInfo);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting player information.");
	}
	let username = playerInfo.username;
	let userId = playerInfo.userId;
	console.log(`[epic-department]: 1: Got player info.`);

	// Get universe id
	let universeId;
	try {
		await tryRetry(async () => {
			universeId = await getUniverseId(inputPlaceId);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting universe id.");
	}
	console.log(`[epic-department]: 2: Got universe id.`);

	// Get universe name
	let universeName;
	try {
		await tryRetry(async () => {
			universeName = await robloxFetchApi.fetchUniverseName(universeId);
		}, 3, 50);
	} catch (error) {
		universeName = `<failed to fetch>`;
		console.warn(`[epic-department]: Failed to get universe name for ${universeId}: ${error}`);
	}
	console.log(`[epic-department]: 3: Got universe name.`);
	
	// Get game badges
	let gameBadges;
	try {
		await tryRetry(async () => {
			gameBadges = await robloxFetchApi.fetchBadgesByUniverseId(universeId);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting game badges.");
	}
	console.log(`[epic-department]: 4: Got badges.`);

	// Get awarded & unawarded badges
	const {awardedBadges, unawardedBadges} = await getAwardedUnawardedBadges(gameBadges, userId);
	console.log(`[epic-department]: 5: Got awarded & unawarded badges.`);

	// Create awarded text
	let awardedText = "";
	for (const badge of awardedBadges) {
		let addText = `\n${badge.name}`;
		if (awardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		awardedText += addText;
	}
	const awardedEmbedField = {
		name: `Awarded Badges (${awardedBadges.length})`,
		value: awardedText,
		inline: true,
	};
	
	// Create unawarded text
	let unawardedText = "";
	for (const badge of unawardedBadges) {
		let addText = `\n${badge.name}`;
		if (unawardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		unawardedText += addText;
	}
	const unawardedEmbedField = {
		name: `Unawarded Badges (${unawardedBadges.length})`,
		value: unawardedText,
		inline: true,
	};

	console.log(
		`[epic-department]: Check badges result:\n` +
		`Text lengths (awarded & unawarded): ${awardedText.length}, ${unawardedText.length}\n` +
		`Awarded badges ratio: ${awardedBadges.length} / ${gameBadges.length}`
	);

	// Create result body
	const resultEmbed = {
		title: `${universeName}`,
		color: successColor,
		fields: [awardedEmbedField, unawardedEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Badge info for [${username}](<https://www.roblox.com/users/${userId}>)`,
		embeds: resultEmbeds,
	}

	return resultBody;
}

async function listBadgesByPlaceId(inputPlaceId, inputPage = 1) {
	const failInfo = {
		resultBody: createFailBody("Error", ""),
		pageCount: 0,
	};
	
	// Get universe id
	let universeId;
	try {
		await tryRetry(async () => {
			universeId = await getUniverseId(inputPlaceId);
		}, 3, 50);
	} catch (error) {
		failInfo.resultBody = createFailBody("Error", "Error in getting universe id.");
		return failInfo;
	}

	// Get universe name
	let universeName;
	try {
		await tryRetry(async () => {
			universeName = await robloxFetchApi.fetchUniverseName(universeId);
		}, 3, 50);
	} catch (error) {
		universeName = `<failed to fetch>`;
		console.warn(`[epic-department]: Failed to get universe name for ${universeId}: ${error}`);
	}
	
	// Get field
	let badgesEmbedField;
	let pageCount;
	const page = parseInt(inputPage);
	try {
		// Get fields
		const storedFields = await getBadgeFields(universeId);
		
		// Get page count
		pageCount = storedFields.length;
		failInfo.resultBody = createFailBody("Invalid page", `Page ${page} isn't from 1 to ${pageCount}.`);
		failInfo.pageCount = pageCount;

		// Get selected field
		badgesEmbedField = storedFields[page - 1];
		badgesEmbedField.name = `Badges (${page}/${pageCount})`;
	} catch (error) {
		return failInfo;
	}
	
	// Create result body
	const resultEmbed = {
		title: `Badge List`,
		color: successColor,
		fields: [badgesEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Badges in [${universeName}](<https://www.roblox.com/games/${inputPlaceId}>)`,
		embeds: resultEmbeds,
	}

	// Create result info
	const resultInfo = {
		resultBody,
		pageCount,
	}

	return resultInfo;
}

// Function module
const functionModule = {
	getUniverseId,
	getUserId,
	checkBadges,
	checkBadgesByPlaceId,
	listBadgesByPlaceId,
};

export { functionModule };
