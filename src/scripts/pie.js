// Imports
import { functionModule as robloxFetchApi } from './roblox-fetch.js';
import { validatePlayerInfo, checkMeetRequirements } from './utils.js';
import { successColor, failBody, fieldValueLimit } from './embed-constants.js';
import { pieHikeGameList, pieSkins, pieTypes } from './pie-hiking-data.js'

// Variables

let cachedPieBadgeIds;

// Local functions

function getRandomPieSkin() {
	// Get skin
	const skinIndex = Math.floor(Math.random() * pieSkins.length);
	const skinInfo = pieSkins[skinIndex];
	return skinInfo;
}

function getRandomWeightedPieType() {
	// Create selections using weights
	let selections = [];
	for (let i = 0; i < pieTypes.length; i++) {
		let weight;
		if (pieTypes[i].useSkins === true) {
			weight = pieSkins.length;
		} else {
			weight = 1;
		}
		for (let j = 0; j < weight; j++) {
			selections.push(i);
		}
	}

	// Make a random selection
	const randomIndex = Math.floor(Math.random() * selections.length);
	const pieTypeIndex = selections[randomIndex];
	return pieTypes[pieTypeIndex];
}

function getPieBadges() {
	// Cached response
	if (cachedPieBadgeIds) {
		return cachedPieBadgeIds;
	}
	
	// Get pie skin badge ids
	const pieBadgeIds = []
	for (const skinInfo of pieSkins) {
		if (!(skinInfo.requirements && skinInfo.requirements.badges)) {
			continue;
		}
		const badges = skinInfo.requirements.badges;
		for (const badgeId of badges) {
			pieBadgeIds.push(badgeId);
		}
	}

	// Get pie type badge ids
	for (const pieInfo of pieTypes) {
		if (!(pieInfo.requirements && pieInfo.requirements.badges)) {
			continue;
		}
		const badges = pieInfo.requirements.badges;
		for (const badgeId of badges) {
			pieBadgeIds.push(badgeId);
		}
	}

	// Set and return
	cachedPieBadgeIds = pieBadgeIds;
	return cachedPieBadgeIds;
}

function checkOwned(info, userId, statistics) {
	// An owner
	const owners = info.owners;
	if (owners && owners.includes(userId)) {
		return true;
	}

	// No requirements
	const requirements = info.requirements;
	if (!requirements) {
		// Check if owners specified
		if (owners) {
			return false;
		} else {
			return true;
		}
	}

	// Meet requirements
	if (checkMeetRequirements(requirements, statistics)) {
		return true;
	}

	// Didn't meet requirements
	return false;
}

// Command functions

function getRandomPieHike() {
	// Get map
	const gameIndex = Math.floor(Math.random() * pieHikeGameList.length);
	const gameInfo = pieHikeGameList[gameIndex];
	return gameInfo;
}

function getAllPieHike() {
	const gameCount = pieHikeGameList.length;

	// Convert game list to text
	let resultText = "";
	resultText += `List of (${gameCount}) pie hiking maps:`;
	for (const gameInfo of pieHikeGameList) {
		resultText += `\n* [${gameInfo.name}](<${gameInfo.link}>)`;
	}
	return resultText;
}

function bakeRandomPie() {
	// Get pie info
	const pieTypeInfo = getRandomWeightedPieType();
	const pieTypeName = pieTypeInfo.name;

	// Get pie name
	let pieName, pieDescription, pieIcon;
	if (pieTypeInfo.useSkins === true) {
		// Get random pie skin
		const pieSkin = getRandomPieSkin();
		pieName = `${pieSkin.name} - ${pieTypeName}`;
		pieDescription = pieSkin.description;
		pieIcon = pieSkin.icon;
	} else {
		pieName = pieTypeName;
		pieDescription = pieTypeInfo.description;
		pieIcon = pieTypeInfo.icon;
	}
	
	// Create response
	let returnText = "Baking ";
	if (pieIcon && pieIcon != "") {
		returnText += `[**${pieName}**](${pieIcon})`;
	} else {
		returnText += `**${pieName}**`;
	}
	returnText += " `🥧`\n";
	returnText += `> ${pieDescription}`;
	
	// Return text
	return returnText;
}

async function getPies(playerInfo) {
	// Get player information
	try {
		playerInfo = await validatePlayerInfo(playerInfo);
	} catch (error) {
		return failBody;
	}
	let username = playerInfo.username;
	let userId = playerInfo.userId;

	// Get owned pie badges
	const badgeOwned = {};
	try {
		const ownedBadgeIds = await robloxFetchApi.fetchAwardedBadgeIds(userId, getPieBadges());
		for (const badgeId of ownedBadgeIds) {
			badgeOwned[badgeId] = true
		}
	} catch (error) {
		return failBody;
	}

	// Create statistics
	const userStatistics = {
		badges: badgeOwned,
	};

	// Get owned pie types
	const ownedPieTypes = []
	for (const pieInfo of pieTypes) {
		if (checkOwned(pieInfo, userId, userStatistics)) {
			ownedPieTypes.push(pieInfo);
			continue;
		}
	}
	
	// Get owned pie skins
	const ownedPieSkins = []
	for (const skinInfo of pieSkins) {
		if (checkOwned(skinInfo, userId, userStatistics)) {
			ownedPieSkins.push(skinInfo);
			continue;
		}
	}
	
	// Create pie types text
	let embedText = "";
	for (const pieInfo of ownedPieTypes) {
		let addText = `\n${pieInfo.name}`;
		if (embedText.length + addText.length > fieldValueLimit) {
			break;
		}
		embedText += addText;
	}
	const pieTypesEmbedField = {
		name: `Pie Types (${ownedPieTypes.length})`,
		value: embedText,
		inline: true,
	};
	
	// Create pie skins text
	embedText = "";
	for (let i = 0; i < ownedPieSkins.length; i++) {
		const skinInfo = ownedPieSkins[i];
		let addText = `${skinInfo.name}`;
		if (i > 0) {
			if (i % 4 == 0) {
				addText = `,\n${addText}`;
			} else {
				addText = `, ${addText}`;
			}
		}
		if (embedText.length + addText.length > fieldValueLimit) {
			break;
		}
		embedText += addText;
	}
	const pieSkinsEmbedField = {
		name: `Pie Skins (${ownedPieSkins.length})`,
		value: embedText,
		inline: true,
	};
	
	// Create result body
	const resultEmbed = {
		title: `Dreamsphere Pies`,
		color: successColor,
		fields: [pieTypesEmbedField, pieSkinsEmbedField,],
	};
	const resultEmbeds = [resultEmbed];
	const resultBody = {
		content: `Pies owned by [${username}](<https://www.roblox.com/users/${userId}>)`,
		embeds: resultEmbeds,
	}

	return resultBody;
}

// Function module
let functionModule = {
	hikeRandom: getRandomPieHike,
	hikeAllText: getAllPieHike,
	bakeRandom: bakeRandomPie,
	getPies,

};

export { functionModule };
