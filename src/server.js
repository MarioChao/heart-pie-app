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

import { AutoRouter } from "itty-router";
import {
	InteractionType,
	InteractionResponseType,
	InteractionResponseFlags,
	MessageComponentTypes,
	ButtonStyleTypes,
} from "discord-interactions";
import { contextWaitUntil } from "./scripts/utils.js";
import {
	utils,
} from "./command-scripts/utils.js";
import {
	createPagesActionRowComponent,
	createPagesTextInputModalBody,
} from "./scripts/bot-response-util.js";
import { getShuffledOptions, getResult } from "./scripts/rps-game.js";
import { functionModule as pieHike } from "./scripts/pie.js";
import { functionModule as epicDepartment } from "./scripts/epic-department.js";
import { createFailBody } from "./scripts/embed-constants.js";
import { gameData } from "./command-scripts/game-data.js";

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
	const { isValid, interaction } = await utils.VerifyDiscordRequest(
		request,
		env,
	);
	console.log("[server]: Received interaction!");
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
		console.log(`[server]: Interaction name: ${name}.`)

		// "test" command
		if (name === "test") {
			// Get info
			const userId = interaction.member.user.id;

			// Response
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					// Fetches a random emoji to send from a helper function
					content: `hello <@${userId}> ` + utils.getRandomEmoji(),
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
				await utils.DiscordRequest(endpoint, {
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
				await utils.DiscordRequest(endpoint, {
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
				const resultText = await pieHike.bakeRandom();
	
				// Result body
				const resultBody = {
					content: resultText,
				};

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await utils.DiscordRequest(endpoint, {
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
					userId: data.options[0] && data.options[0].value,
					username: data.options[1] && data.options[1].value,
				};
				const resultBody = await pieHike.getPies(playerInfo);

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await utils.DiscordRequest(endpoint, {
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

		// "getuserid" command
		if (name === "getuserid") {
			// Get info
			const username = data.options[0].value;

			// Get user id
			const userId = await epicDepartment.getUserId(username);
			const resultText = `\`${userId}\``;

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
				try {
					if (subcommandName === "badge_pack") {
						// Validate badge pack name
						const badgePackName = subcommand.options[0].value;
						if (!gameData.badgePackNames.includes(badgePackName)) {
							resultBody = createFailBody("Error", "Invalid badge pack name.");
							throw new Error(`[server]: Invalid badge pack name.`)
						}

						// Get badge pack badges
						const badgePackBadges = gameData.badgePack_badges[badgePackName];

						// Parse info & check badges
						const playerInfo = {
							userId: subcommand.options[1] && subcommand.options[1].value,
							username: subcommand.options[2] && subcommand.options[2].value,
						};
						resultBody = await epicDepartment.checkBadges(`[pack] ${badgePackName}`, badgePackBadges, playerInfo);
					} else if (subcommandName === "game_name" || subcommandName == "place_id") {
						// Get place id
						let _placeId;
						if (subcommandName == "game_name") {
							// Validate game name
							const gameName = subcommand.options[0].value;
							if (!gameData.gameNames.includes(gameName)) {
								resultBody = createFailBody("Error", "Invalid game name.");
								throw new Error(`[server]: Invalid game name.`)
							}
							_placeId = gameData.game_placeId[gameName];
						} else {
							_placeId = subcommand.options[0].value;
						}
						const placeId = _placeId;

						// Parse info & check badges
						const playerInfo = {
							userId: subcommand.options[1] && subcommand.options[1].value,
							username: subcommand.options[2] && subcommand.options[2].value,
						};
						resultBody = await epicDepartment.checkBadgesByPlaceId(placeId, playerInfo);
					}
					console.info(`[server]: Check badges done.\n${resultBody}`);
				} catch (error) {
					if (resultBody == null) {
						resultBody = createFailBody("Error", "Please try again.")
					}
					console.error(`[server]: Check badges errored: ${error}.\n${resultBody}`);
				}

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await utils.DiscordRequest(endpoint, {
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
				let resultBody;
				try {
					if (subcommandName === "badge_pack") {
						// Validate badge pack name
						const badgePackName = subcommand.options[0].value;
						if (!gameData.badgePackNames.includes(badgePackName)) {
							resultBody = createFailBody("Error", "Invalid badge pack name.");
							throw new Error(`[server]: Invalid badge pack name.`)
						}

						// Get badge pack badges
						const badgePackBadges = gameData.badgePack_badges[badgePackName];
						const badgePackId = gameData.badgePackNames.indexOf(badgePackName);

						// Get badges info
						const page = 1;
						const resultInfo = await epicDepartment.listBadges(`[pack] ${badgePackName}`, badgePackBadges);

						// Parse result
						resultBody = resultInfo.resultBody;
						const pageCount = resultInfo.pageCount;

						// Add components
						const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_packId_${badgePackId}_page_`);
						resultBody.components = [
							pagesActionRow,
						];
					} else if (subcommandName === "game_name" || subcommandName == "place_id") {
						// Get place id
						let placeId;
						if (subcommandName === "game_name") {
							// Validate game name
							const gameName = subcommand.options[0].value;
							if (!gameData.gameNames.includes(gameName)) {
								resultBody = createFailBody("Error", "Invalid game name.");
								throw new Error("[server]: Invalid game name.");
							}
							placeId = gameData.game_placeId[gameName];
						} else if (subcommandName === "place_id") {
							placeId = subcommand.options[0].value;
						}

						// Get badges info
						const page = 1;
						const resultInfo = await epicDepartment.listBadgesByPlaceId(placeId);

						// Parse result
						resultBody = resultInfo.resultBody;
						const pageCount = resultInfo.pageCount;
		
						// Add components
						const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_placeId_${placeId}_page_`);
						resultBody.components = [
							pagesActionRow,
						];
					}
				} catch (error) {
					if (resultBody == null) {
						resultBody = createFailBody("Error", "Please try again.")
					}
					console.error(`[server]: List badges errored: ${error}.\n${resultBody}`);	
				}

				// Edit response
				const endpoint = `webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;
				await utils.DiscordRequest(endpoint, {
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
		console.log(`[server]: Interaction message component id: ${componentId}.`);

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
					await utils.DiscordRequest(endpoint, { method: "DELETE" });
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
					await utils.DiscordRequest(endpoint, {
						method: "PATCH",
						body: {
							content: "Nice choice " + utils.getRandomEmoji(),
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
		else if (componentId.startsWith("hikeall_page")) {
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
				await utils.DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}

		// List badges
		else if (componentId.startsWith("listbadges_packId_")) {
			// Get info
			const componentData = componentId.split("_");
			const badgePackId = parseInt(componentData[2]);
			let page = componentData[4];
			if (page == "search") {
				// Modal interaction
				const resultBody = createPagesTextInputModalBody(`listbadges_packId_${packId}`, "listbadges_modal");
				return new JsonResponse({
					type: InteractionResponseType.MODAL,
					data: resultBody,
				});
			}
			page = parseInt(page);

			// Defer response
			contextWaitUntil(context, async () => {
				// Get badge pack info
				const badgePackName = gameData.badgePackNames[badgePackId];
				const badgePackBadges = gameData.badgePack_badges[badgePackName];

				// Get result info
				const resultInfo = await epicDepartment.listBadges(`[pack] ${badgePackName}`, badgePackBadges, page);
				const resultBody = resultInfo.resultBody;
				const pageCount = resultInfo.pageCount;

				// Add components
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_packId_${badgePackId}_page_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await utils.DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		} else if (componentId.startsWith("listbadges_placeId_")) {
			// Get info
			const componentData = componentId.split("_");
			const placeId = parseInt(componentData[2]);
			let page = componentData[4];
			if (page == "search") {
				// Modal interaction
				const resultBody = createPagesTextInputModalBody(`listbadges_placeId_${placeId}`, "listbadges_modal");
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
				const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_placeId_${placeId}_page_`);
				resultBody.components = [
					pagesActionRow,
				];

				// Edit response
				await utils.DiscordRequest(interactionEndpoint, {
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
		console.log(`[server]: Interaction modal id: ${modalId}.`);

		// Hike all
		if (modalId === "hikeall_modal") {
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
				await utils.DiscordRequest(interactionEndpoint, {
					method: "PATCH",
					body: resultBody,
				});
			});

			// Initial response
			return new JsonResponse(componentDeferredEphemeralResponse);
		}

		// List badges
		else if (modalId === "listbadges_modal") {
			// Get input component
			const inputActionRow = data.components[0];
			const inputComponent = inputActionRow.components[0];
			const inputComponentId = inputComponent.custom_id;

			// Get info
			if (inputComponentId.startsWith("listbadges_packId")) {
				const componentData = inputComponentId.split("_");
				const badgePackId = parseInt(componentData[2]);
				const page = parseInt(inputComponent.value);

				// Defer response
				contextWaitUntil(context, async () => {
					// Get badge pack badges
					const badgePackName = gameData.badgePackNames[badgePackId];
					const badgePackBadges = gameData.badgePack_badges[badgePackName];

					// Get result info
					const resultInfo = await epicDepartment.listBadges(`[pack] ${badgePackName}`, badgePackBadges, page);
					const resultBody = resultInfo.resultBody;
					const pageCount = resultInfo.pageCount;

					// Add components
					const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_packId_${badgePackId}_page_`);
					resultBody.components = [
						pagesActionRow,
					];

					// Edit response
					await utils.DiscordRequest(interactionEndpoint, {
						method: "PATCH",
						body: resultBody,
					});
				});

				// Initial response
				return new JsonResponse(componentDeferredEphemeralResponse);
			} else if (inputComponentId.startsWith("listbadges_placeId")) {
				const componentData = inputComponentId.split("_");
				const placeId = parseInt(componentData[2]);
				const page = parseInt(inputComponent.value);

				// Defer response
				contextWaitUntil(context, async () => {
					// Get result info
					const resultInfo = await epicDepartment.listBadgesByPlaceId(placeId, page);
					const resultBody = resultInfo.resultBody;
					const pageCount = resultInfo.pageCount;
					
					// Add components
					const pagesActionRow = createPagesActionRowComponent(page, pageCount, `listbadges_placeId_${placeId}_page_`);
					resultBody.components = [
						pagesActionRow,
					];
	
					// Edit response
					await utils.DiscordRequest(interactionEndpoint, {
						method: "PATCH",
						body: resultBody,
					});
				});

				// Initial response
				return new JsonResponse(componentDeferredEphemeralResponse);
			}
		}
	} else if (type == InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
		// Get type
		console.log(`[server]: Interaction autocomplete id: ${id}.`);

		// Get focused option
		let _focusedOption;
		for (const option of data.options) {
			if (option.focused === true) {
				_focusedOption = option;
				console.log(`[server]: Found focused option ${_focusedOption.name}.`);
				break;
			}
			if (Array.isArray(option.options)) {
				_focusedOption = option.options.find((value) => (value.focused === true));
				if (_focusedOption != null) {
					console.log(`[server]: Found focused suboption ${_focusedOption.name}.`);
					break;
				}
			}
		}
		const focusedOption = _focusedOption;
		if (focusedOption == null) {
			console.error(`[server]: Unable to find a focused option for autocomplete.`);
			return new JsonResponse({
				type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
				data: {
					choices: [],
				},
			});
		}

		// Get option details
		const optionName = focusedOption.name;
		const optionValue = focusedOption.value;

		// Get choices
		const choices_raw = gameData.getChoicesArrayFromOptionName(optionName);

		// Filter choices
		const choices_filtered = choices_raw.filter((choice) => choice.toLowerCase().indexOf(optionValue.toLowerCase()) !== -1)

		// Trim to 25 elements
		const choices_trimmed = choices_filtered.slice(0, 25);

		// Get choices result
		const choices_result = utils.createCommandChoicesFromArray(choices_trimmed);
		console.log(`[server]: Choices found.`);

		// Return response
		return new JsonResponse({
			type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
			data: {
				choices: choices_result,
			},
		});
	}
});

// Invalid endpoint
router.all('*', () => new Response('Not Found.', { status: 404 }))

export default { ...router };
