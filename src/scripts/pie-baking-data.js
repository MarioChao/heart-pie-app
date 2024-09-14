// Constants

const assetsPrefix = "https://mariochao.github.io/heart-pie-app/src/assets/";

const pieSkins = [
	{
		name: "Ten-Mou Pie",
		description: "Hiking Tool",
		icon: assetsPrefix + "pies/ten-mou.png",
	},
	{
		name: "Moon Pie",
		description: "Hiking Tool",
		icon: assetsPrefix + "pies/moon.png",
		requirements: {
			badges: [2124804350],
		},
	},
	{
		name: "Eye of The Pie",
		description: "An achievement in the scope of our smallness.",
		icon: assetsPrefix + "pies/eye.png",
		requirements: {
			badges: [2124709224],
		},
	},
	{
		name: "Stealth Pie",
		description: "These last 500 years just seemed to race by.",
		icon: assetsPrefix + "pies/stealth.png",
		requirements: {
			badges: [2124702025],
		},
	},
	{
		name: "Cherry Pie",
		description: "Baked by Richardson, Nash jokingly said, 'hand over the pie and no one gets hurt!' and out of kindness he did that anyways.",
		icon: assetsPrefix + "pies/cherry.png",
		requirements: {
			badges: [2124859635],
		},
	},
	{
		name: "Blueberry Pie",
		description: "Baked by Eunoia to assist Nash in case she loses one of her pies.",
		icon: assetsPrefix + "pies/blueberry.png",
		requirements: {
			badges: [2127610756],
		},
	},
	{
		name: "Pumpkin Pi",
		description: "Usually goes up in price during Pi Day.",
		icon: assetsPrefix + "pies/pumpkin.png",
		requirements: {
			badges: [2124874992],
		},
	},
	{
		name: "Noden's Overgrown Pie",
		description: "This type of pie once existed in some ancient cultures, but it became so obscure within them that it is now completely alien and separated from any cultural origin.",
		icon: assetsPrefix + "pies/noden-overgrown.png",
		requirements: {
			badges: [2126097921],
		},
	},
	{
		name: "Apple Pie",
		description: "Too much exposure to this dish may cause a craving for it, Pie Hikers are known for being pie devourers also.",
		icon: assetsPrefix + "pies/apple.png",
		requirements: {
			badges: [2124874992],
		},
	},
	{
		name: "Clarence's Chocolate Pie",
		description: "He may have retired, but his legacy lives on at the hearts of those who used to cheer for him.",
		icon: assetsPrefix + "pies/clarence-chocolate.png",
		requirements: {
			badges: [2124874992],
		},
	},
	{
		name: "Buko Pie",
		description: "A tasty coconut pie disguised in a nice imagery, even if you had lost that match against Stuart he would have given you this pie nonetheless.",
		icon: assetsPrefix + "pies/buko.png",
		requirements: {
			badges: [2124874992],
		},
	},
	{
		name: "Rhubarb Pie",
		description: "Stella's pie, she traveled across Baroniza to find an opponent who could defeat her, and although she expected it to be Robin, you suddenly appeared.",
		icon: assetsPrefix + "pies/rhubarb.png",
		requirements: {
			badges: [2124874992],
		},
	},
	{
		name: "Robin's Key Lime Pie",
		description: "Legend says Robin's blood is 77% brew.",
		icon: assetsPrefix + "pies/robin-key-lime.png",
		requirements: {
			badges: [2124874992],
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

export { pieSkins, pieTypes };
