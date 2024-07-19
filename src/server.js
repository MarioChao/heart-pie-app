/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { AutoRouter, json } from "itty-router";
import {
	InteractionType,
	InteractionResponseType,
	InteractionResponseFlags,
	MessageComponentTypes,
	ButtonStyleTypes,
} from "discord-interactions";
import {
	VerifyDiscordRequest,
	getRandomEmoji,
	DiscordRequest,
	contextWaitUntil,
} from "./scripts/utils.js";
import { getShuffledOptions, getResult } from "./scripts/rps-game.js";
import { functionModule as pieHike } from "./scripts/pie.js";
import { functionModule as epicDepartment } from "./scripts/epic-department.js";

// From https://github.com/discord/cloudflare-sample-app/blob/main/src/server.js
class JsonResponse extends Response {
	constructor(body, init) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
	}
}

// Create an itty-router
const router = AutoRouter();

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
	return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

router.get('/interactions', (request, env) => {
	return new Response(`👋 interactions ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
router.post("/interactions", async (request, env, context) => {
	// Parse request body and verifies incoming requests using discord-interactions package
	const { isValid, interaction } = await VerifyDiscordRequest(
		request,
		env,
	);
	if (!isValid || !interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	// Interaction type and data
	const { type, id, data, token } = interaction;
	console.log(interaction);

	/**
	 * Handle verification requests
	 * https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-acknowledging-ping-requests
	 */
	if (type === InteractionType.PING) {
		return new JsonResponse({ type: InteractionResponseType.PONG });
	}

	/**
	 * Handle slash command requests
	 * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
	 */
	if (type === InteractionType.APPLICATION_COMMAND) {
		const { name } = data;

		// "test" command
		if (name === "test") {
			// Get info
			const userId = interaction.member.user.id;

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					// Fetches a random emoji to send from a helper function
					content: `hello <@${userId}> ` + getRandomEmoji(),
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});
		}

		// "challenge_rps" command
		if (name === "challenge_rps" && id) {
			// Get info
			const userId = interaction.member.user.id;
			const objectName = data.options[0].value;

			// Store game
			activeGames[id] = {
				id: userId,
				objectName,
			};

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Rock paper scissors from <@${userId}>`,
					components: [
						{
							type: MessageComponentTypes.ACTION_ROW,
							components: [
								{
									type: MessageComponentTypes.BUTTON,
									custom_id: `accept_button_${id}`,
									label: "Accept",
									style: ButtonStyleTypes.PRIMARY,
								},
							],
						},
					],
				},
			});
		}

		// "encode" or "decode" command
		if (name === "encode" || name === "decode") {
			// Get info
			const inputText = data.options[0].value;

			// Encode
			let encodedText;
			if (name === "encode") {
				encodedText = Buffer.from(inputText).toString("base64");
			} else {
				encodedText = Buffer.from(inputText, "base64");
			}

			// Response
			const resultText = `\`\`\`${encodedText}\`\`\``;
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: resultText,
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});
		}

		/* Pie hiking commands */
		// "hike" command
		if (name === "hike") {
			// Get map
			const resultGame = pieHike.hikeRandom();
			const resultText = `${resultGame.name}\n\n${resultGame.link}`;

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: resultText,
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});
		}

		// "hikeall" command
		if (name === "hikeall") {
			// Get maps
			const resultText = pieHike.hikeAllText();

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: resultText,
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});
		}

		// "bake" command
		if (name === "bake") {
			// Get pie
			const resultText = pieHike.bakeRandom();

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: resultText,
					flags: InteractionResponseFlags.EPHEMERAL,
				}
			});
		}

		/* Epic Department commands */
		// "badges" command
		if (name === "checkbadges") {
			// Get info
			const subcommand = data.options[0];
			const subcommandName = subcommand.name;

			// Defer response
			contextWaitUntil(context, async () => {
				try {
					// Get result
					let resultBody;
					if (subcommandName === "game_name") {
						const gameName = subcommand.options[0].value;
						console.log(subcommand.options);
						const playerInfo = {
							username: subcommand.options[1].value,
							userId: subcommand.options[2] && subcommand.options[2].value,
						};
						resultBody = await epicDepartment.checkBadgesByGameName(gameName, playerInfo);
					} else if (subcommandName === "place_id") {
						const placeId = subcommand.options[0].value;
						const playerInfo = {
							username: subcommand.options[1].value,
							userId: subcommand.options[2] && subcommand.options[2].value,
						};
						resultBody = await epicDepartment.checkBadgesByPlaceId(placeId, playerInfo);
					}
					console.log(resultBody);
					
					// Edit response
					const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
					console.log(endpoint);
					await DiscordRequest(endpoint, {
						method: "PATCH",
						body: resultBody,
					});
				} catch (error) {
					console.error("Error sending message:", error);
				}
			});

			return new JsonResponse({
				type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: "Loading",
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});

		}
	} else if (type === InteractionType.MESSAGE_COMPONENT) {
		// Get type
		const componentId = data.custom_id;

		if (componentId.startsWith("accept_button_")) {
			/* RPS accept button */
			// Get game id
			const gameId = componentId.replace("accept_button_", "");

			// Get message with token
			const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;
			try {
				// Delete previous message
				contextWaitUntil(context, async () => {
					await DiscordRequest(endpoint, { method: "DELETE" });
				});

				// Send interaction
				return new JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: "What is your object of choice?",
						flags: InteractionResponseFlags.EPHEMERAL,
						components: [
							{
								type: MessageComponentTypes.ACTION_ROW,
								components: [
									{
										type: MessageComponentTypes.STRING_SELECT,
										custom_id: `select_choice_${gameId}`,
										options: getShuffledOptions(),
									},
								],
							},
						],
					},
				});
			} catch (err) {
				console.error("Error sending message:", err);
			}
		} else if (componentId.startsWith("select_choice_")) {
			/* RPS select choice */
			// Get game id
			const gameId = componentId.replace("select_choice_", "");

			// Validate game
			if (!activeGames[gameId]) {
				return;
			}

			// Get user choice
			const userId = interaction.member.user.id;
			const objectName = data.values[0];

			// Calculate result
			const resultStr = getResult(activeGames[gameId], {
				id: userId,
				objectName,
			});

			// Remove game
			delete activeGames[gameId];

			// Get message with token
			const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;
			try {
				// Update previous message
				contextWaitUntil(context, async () => {
					await DiscordRequest(endpoint, {
						method: "PATCH",
						body: {
							content: "Nice choice " + getRandomEmoji(),
							components: [],
						},
					});
				});

				// Send results
				return new JsonResponse({
					type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
					data: {
						content: resultStr,
					},
				});
			} catch (err) {
				console.error("Error sending message:", err);
			}
		}
	}
});

// Invalid endpoint
router.all('*', () => new Response('Not Found.', { status: 404 }))

export default { ...router };
