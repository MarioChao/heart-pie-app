// Imports
import { functionModule as fetchApi } from "./fetch-api.js";

// Constants
const gameIds = {
	"Dream Game": 5475056496,
	"The Forge and the Crucible": 6989453447,
	"The Roulette Saloon": 6787210828,
	"Juke's Tower of Hell": 8562822414,
};

const failBody = {
	embeds: [
		{
			title: "Error",
			description: "Error in fetching",
			color: 0xED4245,
		},
	]
};

const badgesPerFetch = 100;
const reFetchMinutes = 10;

const fieldValueLimit = 1024;

const universeBadgesCache = {};

// Local functions
function getGameNames() {
	const gameNames = Object.keys(gameIds);
	return gameNames;
}

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
async function fetchUniverseName(universeId) {
	// Set up api
	const apiUrl = `https://games.roblox.com/v1/games`;
	const urlParams = new URLSearchParams();
	urlParams.set("universeIds", universeId);

	// Fetch data
	let universeData;
	try {
		const data = await(fetchApi.fetchUrl(apiUrl, urlParams));
		universeData = data.data[0];
	} catch (error) {
		throw error;
	}
	return universeData.name;
}

// Badge api functions
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
		for (let badge of pageBadgeList) {
			badgeList.push(badge);
		}
		console.log(`Fetched: ${badgeList.length}`);

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

async function fetchBadgesByUniverseId(universeId) {
	// Memoize
	let willFetch = false;
	if (universeBadgesCache[universeId] == null) {
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

async function fetchBadgeAwardedDates(userId, badgeIds) {
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
		for (let badge of awardedDates) {
			badgeAwardedDates.push(badge);
		}
	}

	// Return awarded dates
	return badgeAwardedDates;
}

// Users api functions
async function fetchPlayer(userId) {
	// Set up api
	const apiUrl = `https://users.roblox.com/v1/users/${userId}`;

	// Fetch data
	let data;
	try {
		data = await fetchApi.fetchUrl(apiUrl);
	} catch (error) {
		throw error;
	}
	return data;
}

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

	// Fetch data
	let data;
	try {
		data = await fetchApi.fetchUrl(apiUrl, null, requestOptions);
	} catch (error) {
		throw error;
	}
	console.log(data);
	return data;
}

async function fetchUserId(username) {
	// Fetch user
	const users = await fetchUsers([username.toString()]);
	let userId;
	try {
		const user = users.data[0];
		userId = user.id;
	} catch (error) {
		throw error;
	}
	return userId;
}

// Command functions
async function checkBadgesByGameName(gameName, playerInfo) {
	const placeId = gameIds[gameName];
	return checkBadgesByPlaceId(placeId, playerInfo);
}

async function checkBadgesByPlaceId(inputPlaceId, playerInfo) {
	// Get player information
	let playerName = playerInfo.username;
	let userId = playerInfo.userId;
	if (!userId) {
		// Get player userId
		try {
			userId = await fetchUserId(playerName);
		} catch (error) {
			return failBody;
		}
	}
	
	// Get player name
	let player;
	try {
		player = await fetchPlayer(userId);
	} catch (error) {
		return failBody;
	}
	playerName = player.name;

	// Get universe id
	const placeId = parseInt(inputPlaceId);
	let universeId;
	try {
		universeId = await fetchUniverseId(placeId);
	} catch (error) {
		return failBody;
	}

	// Get universe name
	let universeName;
	try {
		universeName = await fetchUniverseName(universeId);
	} catch (error) {
		return failBody;
	}
	
	// Get game badges
	let gameBadges;
	try {
		gameBadges = await fetchBadgesByUniverseId(universeId);
	} catch (error) {
		return failBody;
	}

	// Get badges awarded to player
	const gameBadgeIds = []
	for (let badge of gameBadges) {
		gameBadgeIds.push(badge.id);
	}
	let badgeAwardedDates;
	try {
		badgeAwardedDates = await fetchBadgeAwardedDates(userId, gameBadgeIds);
	} catch (error) {
		return failBody;
	}

	// Sort arrays
	badgeAwardedDates.sort((a, b) => {
		return a.badgeId > b.badgeId ? 1 : -1;
	});
	gameBadges.sort((a, b) => {
		return a.id > b.id ? 1 : -1;
	});

	// Get awarded & not awarded badges
	const awardedBadges = [];
	const unawardedBadges = [];
	let i0 = 0;
	let i1 = 0;
	while (i0 < gameBadges.length && i1 < badgeAwardedDates.length) {
		const gameBadge = gameBadges[i0];
		const awardedBadgeId = badgeAwardedDates[i1].badgeId;
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

	// Get awarded text
	let awardedText = "";
	for (let badge of awardedBadges) {
		let addText = `\n${badge.name}`;
		if (awardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		awardedText += addText;
	}
	let awardedEmbedField = {
		name: `Awarded Badges (${awardedBadges.length})`,
		value: awardedText,
		inline: true,
	};
	
	// Get unawarded text
	let unawardedText = "";
	for (let badge of unawardedBadges) {
		let addText = `\n${badge.name}`;
		if (unawardedText.length + addText.length > fieldValueLimit) {
			break;
		}
		unawardedText += addText;
	}
	let unawardedEmbedField = {
		name: `Unawarded Badges (${unawardedBadges.length})`,
		value: unawardedText,
		inline: true,
	};

	console.log(awardedText.length, unawardedText.length);
	console.log("%d/%d", badgeAwardedDates.length, gameBadges.length);
	
	// Get result body
	let resultEmbed = {
		title: `${universeName}`,
		color: 0x57F287,
		fields: [awardedEmbedField, unawardedEmbedField,],
	};
	let resultEmbeds = [resultEmbed];
	let resultBody = {
		content: `Badge info for [${playerName}](<https://www.roblox.com/users/${userId}>)`,
		embeds: resultEmbeds,
	}

	return resultBody;
}

// Function module
let functionModule = {};
functionModule.checkBadgesByGameName = checkBadgesByGameName;
functionModule.checkBadgesByPlaceId = checkBadgesByPlaceId;
functionModule.gameNames = getGameNames();

export { functionModule };
