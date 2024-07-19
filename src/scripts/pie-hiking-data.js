// Constants

const assetsPrefix = "https://mariochao.github.io/heart-pie-app/src/assets/"

const pieHikeGameList = [
	{
		name: "VerticalAscent's Dream Game",
		link: "https://www.roblox.com/games/5475056496/Dream-Game",
	},
	{
		name: "Noden Trials (Dream Game)",
		link: "https://www.roblox.com/games/10252776199/Noden-Trials",
	},
	{
		name: "RaySteelcross's High Hike",
		link: "https://www.roblox.com/games/14834601229/High-Hike",
	},
	{
		name: "murphtastic's Rifthiker",
		link: "https://www.roblox.com/games/16656728068/RIFTHIKER",
	},
	{
		name: "ÆTERNUM*'s Postmortem",
		link: "https://www.roblox.com/games/16549530059/POSTMORTEM",
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
		name: "CactusHand's template",
		link: "https://www.roblox.com/games/16916556893/UNCOPYLOCKED-Pie-Hiking-Template",
	},
	{
		name: "OToDeath's course",
		link: "https://www.roblox.com/games/17675518606/wip-pie-game",
	},
];

const pieSkins = [
	{
		name: "Ten-Mou Pie",
		description: "Semi-Hiking Tool",
		icon: assetsPrefix + "pies/ten-mou.png",
	},
	{
		name: "Moon Pie",
		description: "Hiking Tool",
		icon: assetsPrefix + "pies/moon.png",
	},
	{
		name: "Pumpkin Pi",
		description: "Usually goes up in price during Pi Day",
		icon: assetsPrefix + "pies/pumpkin.png",
		requirements: {
			badges: [2124804350],
		},
	},
	{
		name: "Eye of The Pie",
		description: "A achievement in the scope of our smallness (sic)",
		icon: assetsPrefix + "pies/eye.png",
		requirements: {
			badges: [2124709224],
		},
	},
	{
		name: "Stealth Pie",
		description: "These last 500 years just seemed to race by",
		icon: assetsPrefix + "pies/stealth.png",
		requirements: {
			badges: [2124702025],
		},
	},
	{
		name: "Cherry Pie",
		description: "Baked by Richardson, Nash jokingly said, 'hand over the pie and no one gets hurt!' and out of kindness he did that anyways",
		icon: assetsPrefix + "pies/cherry.png",
		requirements: {
			badges: [2124859635],
		},
	},
	{
		name: "Blueberry Pie",
		description: "Baked by Eunoia to assist Nash in case she loses one of her pies",
		icon: assetsPrefix + "pies/blueberry.png",
		requirements: {
			badges: [2127610756],
		},
	},
	{
		name: "Heart Pie",
		description: "Healthier Hiking Tool",
		icon: assetsPrefix + "pies/heart.png",
		owners: [417781436],
	},
	{
		name: "Easter Pie",
		description: "Easter Pie",
		icon: assetsPrefix + "pies/easter.png",
		requirements: {
			badges: [2143545580],
		},
	},
];

const pieTypes = [
	{
		name: "Regular Pie",
		description: "lorem ipsum",
		useSkins: true,
	},
	{
		name: "Dual Vulcan Pies",
		description: "Have your victims bear the shame of being Icon of Pie.",
		icon: assetsPrefix + "pies/dual-vulcan.png",
		requirements: {
			badges: [2125613500],
		},
	},
	{
		name: "*Super Pie*",
		description: "lorem ipsum",
		useSkins: true,
		owners: [4736691],
	},
	{
		name: "Petrified Ascii Pie",
		description: "🥧",
		icon: assetsPrefix + "pies/petrified-ascii.png",
		owners: [],
	},
];

export { pieHikeGameList, pieSkins, pieTypes };
