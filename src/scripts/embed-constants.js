// Constants

export const successColor = 0x57F287;

export const failBody = {
	embeds: [
		{
			title: "Error",
			description: "Error in fetching",
			color: 0xED4245,
		},
	]
};

export const fieldValueLimit = 1024;

export function createFailBody(title, description) {
	const resultBody = {
		embeds: [
			{
				title,
				description,
				color: 0xED4245,
			},
		]
	};
	return resultBody
}
