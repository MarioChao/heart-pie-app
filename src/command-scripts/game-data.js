// Imports

import epdp_badges from './pack-epic-department.json' with { type: 'json' };
import phb_badges from './pack-pie-hiking-badger.json' with { type: 'json' };

// Constants

const game_placeId = {
	"> home": 12117889379,
	"Abyss World": 12151453277,
	"april fools arg 2": 77570416953336,
	"Badge Points": 88622467292584,
	"CRAZY HORSE GAME": 15716048273,
	"Detachment: Reimagined": 18754445751,
	"Dimensions": 8927874968,
	"Displacement and Destination": 9678077803,
	"DOORS": 6516141723,
	"Dream Dive": 18296261309,
	"Dream Game": 5475056496,
	"Dream Universe": 12931465480,
	"DREAM WORLD": 3957129026,
	"Eternal Towers of Hell": 8562822414,
	"Gears": 3372306786,
	"High Hike": 14834601229,
	"Incessant Dream": 74336084240070,
	"Inver~o": 13621526714,
	"Isolarium": 123210162111817,
	"late july, midsummer": 14107732720,
	"Myth Game": 11656808939,
	"NEON MILKBOX ネオン・ミルクボックス": 100801019999893,
	"Nevermoor's Murder Mystery": 13779221881,
	"Nullscape": 129279692364812,
	"Pie Hiking Badger": 94427741197530,
	"POSTMORTEM": 16549530059,
	"Pool": 7198876449,
	"Pressure": 12411473842,
	"Project Somnia": 14474926935,
	"RBLX: Dream Emulator": 110229037,
	"something, somewhere ❄️": 10850058564,
	"STATION": 14255305022,
	"sun, moon, and stars. to these i bid adieu": 7554879061,
	"The Forge and the Crucible": 6989453447,
	"The Roulette Saloon": 6787210828,
	"The Qoppa Epistles": 14708635480,
	"To The Sky, I Leave My Name": 140121834237082,
	"Ultra Hard Badge List: Reborn": 16859146415,
	"Viper Enclave": 10734356776,
};

const badgePack_badges = {
	"Epic Department": epdp_badges,
	"Pie Hiking Badger": phb_badges,
}

const badgePackNames = Object.keys(badgePack_badges);
const gameNames = Object.keys(game_placeId);

function getChoicesArrayFromOptionName(optionName) {
	if (optionName === "game_name") return gameNames;
	if (optionName === "badge_pack") return badgePackNames;
	return [];
}

const gameData = {
	badgePack_badges,
	badgePackNames,
	game_placeId,
	gameNames,
	getChoicesArrayFromOptionName,
};

export { gameData };
