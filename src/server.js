/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Imports

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
import {
	createPagesActionRowComponent,
	createPagesTextInputModalBody,
} from "./scripts/bot-response-util.js";
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

// Constants

// Create an itty-router
const router = AutoRouter();

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

// Default deferred response
const deferredEphemeralResponse = {
	type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
	data: {
		content: "Loading",
		flags: InteractionResponseFlags.EPHEMERAL,
	},
};

const deferredNormalResponse = {
	type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
	data: {
		content: "Loading",
	},
};

const componentDeferredEphemeralResponse = {
	type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
	data: {
		content: "Loading",
		flags: InteractionResponseFlags.EPHEMERAL,
	},
};

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
									style: ButtonStyleTypes.PRIMARY,
									label: "Accept",
									custom_id: `accept_button_${id}`,
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
			// Defer response
			contextWaitUntil(context, async () => {
				// Get map
				const resultGame = await pieHike.hikeRandom();
				const resultText = `${resultGame.name}\n\n${resultGame.link}`;

				// Result body
				const resultBody = {
					content: resultText,
				};
	
				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}

		// "hikeall" command
		if (name === "hikeall") {
			// Defer response
			contextWaitUntil(context, async () => {
				// Get result
				const resultInfo = await pieHike.hikeAllInfo();
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				const page = 1;

				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `hikeall_page_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}

		// "bake" command
		if (name === "bake") {
			// Defer response
			contextWaitUntil(context, async () => {
				// Get pie
				const resultText = pieHike.bakeRandom();
	
				// Result body
				const resultBody = {
					content: resultText,
				};

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}

		// "getpies" command
		if (name === "getpies") {
			// Defer response
			contextWaitUntil(context, async () => {
				// Get result
				const playerInfo = {
					username: data.options[0].value,
					userId: data.options[1] && data.options[1].value,
				};
				const resultBody = await pieHike.getPies(playerInfo);

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}

		/* Epic Department commands */
		
		// "getuniverseid" command
		if (name === "getuniverseid") {
			// Get info
			const placeId = data.options[0].value;

			// Get universe id
			const universeId = await epicDepartment.getUniverseId(placeId);
			const resultText = `\`${universeId}\``;

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: resultText,
					flags: InteractionResponseFlags.EPHEMERAL,
				},
			});
		}

		// "checkbadges" command
		if (name === "checkbadges") {
			// Get info
			const subcommand = data.options[0];
			const subcommandName = subcommand.name;

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result
				let resultBody;
				if (subcommandName === "game_name") {
					const gameName = subcommand.options[0].value;
					const placeId = epicDepartment.gameIds[gameName];
					const playerInfo = {
						username: subcommand.options[1].value,
						userId: subcommand.options[2] && subcommand.options[2].value,
					};
					resultBody = await epicDepartment.checkBadgesByPlaceId(placeId, playerInfo);
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
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}

		// "listbadges" command
		if (name === "listbadges") {
			// Get info
			const subcommand = data.options[0];
			const subcommandName = subcommand.name;

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result
				let resultInfo;
				let placeId;
				if (subcommandName === "game_name") {
					const gameName = subcommand.options[0].value;
					placeId = epicDepartment.gameIds[gameName];
					resultInfo = await epicDepartment.listBadgesByPlaceId(placeId);
				} else if (subcommandName === "place_id") {
					placeId = subcommand.options[0].value;
					resultInfo = await epicDepartment.listBadgesByPlaceId(placeId);
				}
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				const page = 1;

				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_page_${placeId}_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await DiscordRequest(endpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(deferredEphemeralResponse);
		}
	} else if (type === InteractionType.MESSAGE_COMPONENT) {
		// Get interaction endpoint
		const interactionEndpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;

		// Get type
		const componentId = data.custom_id;

		// RPS
		if (componentId.startsWith("accept_button_")) {
			/* RPS accept button */
			// Get game id
			const gameId = componentId.replace("accept_button_", "");

			try {
				// Delete previous message
				contextWaitUntil(context, async () => {
					// Get message with token
					const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;
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

			try {
				// Update previous message
				contextWaitUntil(context, async () => {
					// Get message with token
					const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;
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

		// Hike all
		if (componentId.startsWith("hikeall_page")) {
			// Get info
			const componentData = componentId.substring("hikeall_page_".length).split("_"); // modify
			let page = componentData[0];
			if (page == "search") {
				// Modal interaction
				const resultBody = createPagesTextInputModalBody(`hikeall_input_`, "hikeall_modal");
				return new JsonResponse({
					type: InteractionResponseType.MODAL,
					data: resultBody,
				});
			}
			page = parseInt(page);

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result info
				const resultInfo = await pieHike.hikeAllInfo(page); // modify
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				
				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `hikeall_page_`); // modify
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}

		// List badges
		if (componentId.startsWith("listbadges_page")) {
			// Get info
			const componentData = componentId.substring("listbadges_page_".length).split("_");
			const placeId = parseInt(componentData[0]);
			let page = componentData[1];
			if (page == "search") {
				// Modal interaction
				const resultBody = createPagesTextInputModalBody(`listbadges_input_${placeId}`, "listbadges_modal");
				return new JsonResponse({
					type: InteractionResponseType.MODAL,
					data: resultBody,
				});
			}
			page = parseInt(page);

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result info
				const resultInfo = await epicDepartment.listBadgesByPlaceId(placeId, page);
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				
				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_page_${placeId}_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}
	} else if (type === InteractionType.MODAL_SUBMIT) {
		// Get interaction endpoint
		const interactionEndpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/${interaction.message.id}`;

		// Get type
		const modalId = data.custom_id;

		// Hike all
		if (modalId === "hikeall_modal"){
			// Get input component
			const inputActionRow = data.components[0];
			const inputComponent = inputActionRow.components[0];
			const inputComponentId = inputComponent.custom_id;

			// Get info
			const componentData = inputComponentId.substring("hikeall_input_".length).split("_"); // modify
			const page = parseInt(inputComponent.value);

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result info
				const resultInfo = await pieHike.hikeAllInfo(page); // modify
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				
				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `hikeall_page_`); // modify
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}

		// List badges
		if (modalId === "listbadges_modal") {
			// Get input component
			const inputActionRow = data.components[0];
			const inputComponent = inputActionRow.components[0];
			const inputComponentId = inputComponent.custom_id;

			// Get info
			const componentData = inputComponentId.substring("listbadges_input_".length).split("_");
			const placeId = parseInt(componentData[0]);
			const page = parseInt(inputComponent.value);

			// Defer response
			contextWaitUntil(context, async () => {
				// Get result info
				const resultInfo = await epicDepartment.listBadgesByPlaceId(placeId, page);
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;
				
				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_page_${placeId}_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}
	}
});

// Invalid endpoint
router.all('*', () => new Response('Not Found.', { status: 404 }))

export default { ...router };
