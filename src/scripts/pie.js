// Constants
const assetsPrefix = "https://mariochao.github.com/heart-pie-app/assets/"

const pieHikeGameList = [
	{
		name: "VerticalAscent's Dream Game",
		link: "https://www.roblox.com/games/5475056496/Dream-Game",
	},
	{
		name: "hypnasail's hell",
		link: "https://www.roblox.com/games/10610597812/Pie",
	},
	{
		name: "Cyn_clical's heaven",
		link: "https://www.roblox.com/games/9422644141/pie-video-game",
	},
	{
		name: "Epic Department's tournament (private)",
		link: "https://www.roblox.com/games/9761630409/Pie-Hiking-Tournament",
	},
	{
		name: "murphtastic's Rifthiker",
		link: "https://www.roblox.com/games/16656728068/RIFTHIKER",
	},
	{
		name: "rxincarnated's practice",
		link: "https://www.roblox.com/games/5375626680/Pie-Hiking-Practice",
	},
	{
		name: "Xx_raisinman1xX's course",
		link: "https://www.roblox.com/games/10881334186/Pie-hike-to-the-top",
	},
	{
		name: "MANNITOLS's pillar",
		link: "https://www.roblox.com/games/10935753837/Iceberg-Pie-Hike",
	},
	{
		name: "RaySteelcross's High Hike",
		link: "https://www.roblox.com/games/14834601229/High-Hike",
	},
	{
		name: "CactusHand's template",
		link: "https://www.roblox.com/games/16916556893/UNCOPYLOCKED-Pie-Hiking-Template",
	}
];

const pieList = {
	"Ten-Mou Pie": {
		description: "Semi-Hiking Tool",
		icon: assetsPrefix + "pies/ten-mou.png",
	},
	"Moon Pie": {
		description: "Hiking Tool",
		icon: assetsPrefix + "pies/moon.png",
	},
	"Pumpkin Pi": {
		description: "Usually goes up in price during Pi Day",
		icon: assetsPrefix + "pies/pumpkin.png",
	},
	"Eye of The Pie": {
		description: "A achievement in the scope of our smallness (sic)",
		icon: assetsPrefix + "pies/eye.png",
	},
	"Stealth Pie": {
		description: "These last 500 years just seemed to race by",
		icon: assetsPrefix + "pies/stealth.png",
	},
	"Cherry Pie": {
		description: "Baked by Richardson, Nash jokingly said, 'hand over the pie and no one gets hurt!' and out of kindness he did that anyways",
		icon: assetsPrefix + "pies/cherry.png",
	},
	"Blueberry Pie": {
		description: "Baked by Eunoia to assist Nash in case she loses one of her pies",
		icon: assetsPrefix + "pies/blueberry.png",
	},
	"Dual Vulcan Pies": {
		description: "Have your victims bear the shame of being Icon of Pie.",
		icon: assetsPrefix + "pies/dual-vulcan.png",
	},
	"Heart Pie": {
		description: "Healthier Hiking Tool",
		icon: assetsPrefix + "pies/heart.png",
	},
	"Super Pie": {
		description: "Hiking Tool",
		icon: assetsPrefix + "pies/moon.png",
	},
	"Easter Pie": {
		description: "Easter Pie",
		icon: assetsPrefix + "pies/easter.png",
	},
};

// Local functions
function getRandomPieHike() {
	// Get map
	const gameCount = pieHikeGameList.length;
	const gameIndex = Math.floor(Math.random() * gameCount);
	const gameInfo = pieHikeGameList[gameIndex];
	return gameInfo;
}

function getAllPieHike() {
	const gameCount = pieHikeGameList.length;

	// Convert game list to text
	let resultText = "";
	resultText += `List of (${gameCount}) pie hiking maps:`;
	for (let gameInfo of pieHikeGameList) {
		resultText += `\n* [${gameInfo.name}](<${gameInfo.link}>)`;
	}
	return resultText;
}

function bakeRandomPie() {
	// Get pie
	const pieNameList = Object.keys(pieList);
	const pieIndex = Math.floor(Math.random() * pieNameList.length);
	const pieName = pieNameList[pieIndex];
	const pieInfo = pieList[pieName];
	const pieDescription = pieInfo.description;
	const pieIcon = pieInfo.icon;
	
	// Get text
	let returnText = "Baking ";
	if (pieIcon && pieIcon != "") {
		returnText += `[**${pieName}**](${pieIcon})`;
	} else {
		returnText += `**${pieName}**`;
	}
	returnText += " `🥧`\n";
	returnText += `> ${pieDescription}`;
	
	return returnText;
}

// Function module
let functionModule = {};
functionModule.hikeRandom = getRandomPieHike;
functionModule.hikeAllText = getAllPieHike;
functionModule.bakeRandom = bakeRandomPie;

export { functionModule };
