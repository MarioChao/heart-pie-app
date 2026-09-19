// Imports
import { functionModule as robloxFetchApi } from './roblox-fetch.js';
import { tryRetry, validatePlayerInfo } from './utils.js';
import { successColor, fieldValueLimit, createFailBody } from './embed-constants.js';
import { gameData } from '../command-scripts/game-data.js';
import { utils } from '../command-scripts/utils.js';

// Constants

const reFetchMinutes = 1;
const universeBadgeFieldsCache = {};
console.log("[epic-department]: Restart.");

// Local functions

/**
 * 
 * @param {[{name: string, id: number}]} badges Array of badges to create fields of.
 * @param {boolean} addHyperLink Whether each badge name will be hyperlinked.
 */
function createBadgeFields(badges, addHyperLink) {
	// Create badge fields of text length <= fieldValueLimit
	let embedText = "";
	const storedFields = [];
	for (let i = 0; i < badges.length; i++) {
		// Generate info
		const badge = badges[i];
		const badgeUrl = `https://roblox.com/badges/${badge.id}`;
		const addText = addHyperLink ? `\n[${badge.name}](${badgeUrl})` : `\n${badge.name}`;

		// Check overflow
		if (embedText.length + addText.length > fieldValueLimit) {
			// Push field
			storedFields.push({
				name: `Badges (${badges.length})`,
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
		name: `Badges (${badges.length})`,
		value: embedText,
		inline: true,
	});

	// Return
	return storedFields;
}

async function _createBadgeFieldsFromUniverseId(universeId) {
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
	const storedFields = createBadgeFields(gameBadges, true);

	// Return
	return storedFields;
}

async function getBadgeFieldsFromUniverseId_memoized(universeId) {
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
				fields: await _createBadgeFieldsFromUniverseId(universeId),
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

/**
 * 
 * @param {string} resultEmbedTitle Title of the embed.
 * @param {[{name: string, id: number}]} gameBadges Badges to check.
 * @param {{username: string?, userId: number?}} playerInfo 
 * @returns Result body with awarded & unawarded embed fields.
 */
async function checkBadges(resultEmbedTitle, gameBadges, playerInfo) {
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
	console.log(`[epic-department]: checkBadges 1: Got player info.`);

	// Get awarded & unawarded badges
	const {awardedBadges, unawardedBadges} = await getAwardedUnawardedBadges(gameBadges, userId);
	console.log(`[epic-department]: checkBadges 2: Got awarded & unawarded badges.`);

	// Create awarded text
	const awardedEmbedField = createBadgeFields(awardedBadges, false)[0];
	awardedEmbedField.name = `Awarded Badges (${awardedBadges.length})`;
	
	// Create unawarded text
	const unawardedEmbedField = createBadgeFields(unawardedBadges, false)[0];
	unawardedEmbedField.name = `Unawarded Badges (${unawardedBadges.length})`;

	console.log(
		`[epic-department]: Check badges result:\n` +
		`Text lengths (awarded & unawarded): ${awardedEmbedField.value.length}, ${unawardedEmbedField.value.length}\n` +
		`Awarded badges ratio: ${awardedBadges.length} / ${gameBadges.length}`
	);

	// Create result body
	const resultEmbed = {
		title: `${resultEmbedTitle}`,
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
	console.log(`[epic-department]: checkBadgesByPlaceId 1: Got player info.`);

	// Get universe id
	let universeId;
	try {
		await tryRetry(async () => {
			universeId = await getUniverseId(inputPlaceId);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting universe id.");
	}
	console.log(`[epic-department]: checkBadgesByPlaceId 2: Got universe id.`);

	// Get universe name
	let universeName;
	try {
		await tryRetry(async () => {
			universeName = await robloxFetchApi.fetchUniverseName(universeId);
		}, 3, 50);
	} catch (error) {
		universeName = `<failed to fetch>`;
		console.warn(`[epic-department]: Failed to get universe name for ${universeId}: ${error}`);

		// Get name from stored game data
		const gameName = utils.getKeyByValue(gameData.game_placeId, inputPlaceId);
		if (gameName != null) {
			universeName = gameName;
			console.warn(`[epic-department]: Got backup name for ${universeId} from game data: ${gameName}.`);
		}
	}
	console.log(`[epic-department]: checkBadgesByPlaceId 3: Got universe name.`);

	// Get game badges
	let gameBadges;
	try {
		await tryRetry(async () => {
			gameBadges = await robloxFetchApi.fetchBadgesByUniverseId(universeId);
		}, 3, 50);
	} catch (error) {
		return createFailBody("Error", "Error in getting game badges.");
	}
	console.log(`[epic-department]: checkBadgesByPlaceId 4: Got badges.`);

	// Check badges
	const resultBody = await checkBadges(`${universeName}`, gameBadges, playerInfo);
	resultBody.content += `, game [${universeName}](<https://www.roblox.com/games/${inputPlaceId}>)`;
	console.log(`[epic-department]: checkBadgesByPlaceId 5: Finished checking badges.`);

	// Return
	return resultBody;
}

/**
 * 
 * @param {string} resultEmbedTitle Title of the embed.
 * @param {[{name: string, id: number}]} gameBadges Badges to list.
 * @param {number} inputPage Page number to display.
 * @returns 
 */
async function listBadges(resultEmbedTitle, gameBadges, inputPage = 1) {
	const failInfo = {
		resultBody: createFailBody("Error", ""),
		pageCount: 0,
	};

	// Get field for the page
	let badgesEmbedField;
	let pageCount;
	const page = parseInt(inputPage);
	try {
		// Get fields
		const storedFields = createBadgeFields(gameBadges, true);

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
	console.log(`[epic-department]: listBadges 1: Got embed field.`);

	// Create result body
	const resultEmbed = {
		title: `${resultEmbedTitle}`,
		color: successColor,
		fields: [badgesEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Badges in ${resultEmbedTitle}`,
		embeds: resultEmbeds,
	};

	// Create result info
	const resultInfo = {
		resultBody,
		pageCount,
	};

	return resultInfo;
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
	console.log(`[epic-department]: listBadgesByPlaceId 1: Got universe id.`);

	// Get universe name
	let universeName;
	try {
		await tryRetry(async () => {
			universeName = await robloxFetchApi.fetchUniverseName(universeId);
		}, 3, 50);
	} catch (error) {
		universeName = `<failed to fetch>`;
		console.warn(`[epic-department]: Failed to get universe name for ${universeId}: ${error}`);

		// Get name from stored game data
		const gameName = utils.getKeyByValue(gameData.game_placeId, inputPlaceId);
		if (gameName != null) {
			universeName = gameName;
			console.warn(`[epic-department]: Got backup name for ${universeId} from game data: ${gameName}.`);
		}
	}
	console.log(`[epic-department]: listBadgesByPlaceId 2: Got universe name.`);

	// Get field for the page
	let badgesEmbedField;
	let pageCount;
	const page = parseInt(inputPage);
	try {
		// Get fields
		failInfo.resultBody = createFailBody("Error", `Failed to get badges from universe ${universeId}.`);
		const storedFields = await getBadgeFieldsFromUniverseId_memoized(universeId);

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
	console.log(`[epic-department]: listBadgesByPlaceId 3: Got embed field.`);

	// Create result body
	const resultEmbed = {
		title: `${universeName}`,
		color: successColor,
		fields: [badgesEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Badges in [${universeName}](<https://www.roblox.com/games/${inputPlaceId}>)`,
		embeds: resultEmbeds,
	};

	// Create result info
	const resultInfo = {
		resultBody,
		pageCount,
	};

	return resultInfo;
}

// Function module
const functionModule = {
	getUniverseId,
	getUserId,
	checkBadges,
	checkBadgesByPlaceId,
	listBadges,
	listBadgesByPlaceId,
};

export { functionModule };
