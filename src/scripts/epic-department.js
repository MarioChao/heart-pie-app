// Imports
import { functionModule as robloxFetchApi } from './roblox-fetch.js';
import { validatePlayerInfo } from './utils.js';
import { successColor, failBody, fieldValueLimit, createFailBody } from './embed-constants.js';

// Constants
const gameIds = {
	"Dream Game": 5475056496,
	"The Forge and the Crucible": 6989453447,
	"The Roulette Saloon": 6787210828,
	"Juke's Tower of Hell": 8562822414,
};

const reFetchMinutes = 1;
const universeBadgeFieldsCache = {};
console.log("restart");

// Local functions
function getGameNames() {
	const gameNames = Object.keys(gameIds);
	return gameNames;
}

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
		universeId = await robloxFetchApi.fetchUniverseId(placeId);
	} catch (error) {
		return failBody;
	}
	return universeId;
}

async function checkBadgesByGameName(gameName, playerInfo) {
	const placeId = gameIds[gameName];
	return checkBadgesByPlaceId(placeId, playerInfo);
}

async function checkBadgesByPlaceId(inputPlaceId, playerInfo) {
	// Get player information
	try {
		playerInfo = await validatePlayerInfo(playerInfo);
	} catch (error) {
		return failBody;
	}
	let username = playerInfo.username;
	let userId = playerInfo.userId;

	// Get universe id
	let universeId;
	try {
		universeId = await getUniverseId(inputPlaceId);
	} catch (error) {
		return failBody;
	}

	// Get universe name
	let universeName;
	try {
		universeName = await robloxFetchApi.fetchUniverseName(universeId);
	} catch (error) {
		return failBody;
	}
	
	// Get game badges
	let gameBadges;
	try {
		gameBadges = await robloxFetchApi.fetchBadgesByUniverseId(universeId);
	} catch (error) {
		return failBody;
	}

	// Get badges awarded to player
	const gameBadgeIds = []
	for (const badge of gameBadges) {
		gameBadgeIds.push(badge.id);
	}
	let awardedBadgeIds;
	try {
		awardedBadgeIds = await robloxFetchApi.fetchAwardedBadgeIds(userId, gameBadgeIds);
	} catch (error) {
		return failBody;
	}

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

	console.log(awardedText.length, unawardedText.length);
	console.log("%d/%d", awardedBadgeIds.length, gameBadges.length);
	
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
		resultBody: failBody,
		pageCount: 0,
	};
	
	// Get universe id
	let universeId;
	try {
		universeId = await getUniverseId(inputPlaceId);
	} catch (error) {
		return failInfo;
	}

	// Get universe name
	let universeName;
	try {
		universeName = await robloxFetchApi.fetchUniverseName(universeId);
	} catch (error) {
		return failInfo;
	}
	
	// Get field
	let badgesEmbedField;
	let pageCount;
	let page = parseInt(inputPage);
	try {
		// Get fields
		const storedFields = await getBadgeFields(universeId);
		
		// Get page count
		pageCount = storedFields.length;
		failInfo.resultBody = createFailBody("Invalid page", `Page ${page} isn't from 1 to ${pageCount}`);
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
let functionModule = {
	getUniverseId,
	checkBadgesByGameName,
	checkBadgesByPlaceId,
	listBadgesByPlaceId,
	gameNames: getGameNames(),
	gameIds,
};

export { functionModule };
