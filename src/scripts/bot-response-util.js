// Imports
import {
	MessageComponentTypes,
	ButtonStyleTypes,
	TextStyleTypes,
} from "discord-interactions";
import { fieldValueLimit } from "./embed-constants";

export function createButtonComponent(label, customId, disabled, buttonStyle = ButtonStyleTypes.SECONDARY) {
	const component = {
		type: MessageComponentTypes.BUTTON,
		style: buttonStyle,
		label,
		custom_id: customId,
		disabled,
	};
	return component;
}

/**
 * 
 * @param {string} label 
 * @param {string} customId 
 * @param {boolean} required 
 * @returns 
 */
export function createTextInputComponent(label, customId, required) {
	const component = {
		type: MessageComponentTypes.INPUT_TEXT,
		style: TextStyleTypes.SHORT,
		label,
		custom_id: customId,
		required,
	};
	return component;
}

export function createPagesActionRowComponent(page, pageCount, buttonIdText, replacePattern = "$") {
	const regex = new RegExp(replacePattern, "g");
	const initialComponents = [
		createButtonComponent("1", buttonIdText.replace(regex, "01"), page == 1),
		createButtonComponent("◀", buttonIdText.replace(regex, `${page - 1}`), page <= 1),
		createButtonComponent("...", buttonIdText.replace(regex, "search")),
		createButtonComponent("▶", buttonIdText.replace(regex, `${page + 1}`), page >= pageCount),
		createButtonComponent(`${pageCount}`, buttonIdText.replace(regex, `00${pageCount}`), page == pageCount),
	];

	const finalComponent = {
		type: MessageComponentTypes.ACTION_ROW,
		components: initialComponents,
	};

	return finalComponent;
}

/**
 * 
 * @param {string} textInputId The id of the Text Input component
 * @param {string} modalId The id of the modal interaction
 * @returns 
 */
export function createPagesTextInputModalBody(textInputId, modalId) {
	const inputComponent = createTextInputComponent("Page #", textInputId, false);
	const resultBody = {
		title: "Go to Page",
		custom_id: modalId,
		components: [
			{
				type: MessageComponentTypes.ACTION_ROW,
				components: [
					inputComponent,
				]
			}
		],
	};
	return resultBody
}

/**
 * 
 * @param {[T]} array An array
 * @param {string} fieldTitle The name of each field
 * @param {(T) => string} textFormat The name of each field
 * @returns 
 * @template T
 */
export function createFields(array, fieldTitle, textFormat) {
	// Create array texts
	let embedText = "";
	const storedFields = [];
	for (let i = 0; i < array.length; i++) {
		// Generate info
		const item = array[i];
		const addText = "\n" + textFormat(item);

		// Check overflow
		if (embedText.length + addText.length > fieldValueLimit) {
			// Push field
			storedFields.push({
				name: fieldTitle,
				value: embedText,
				inline: true,
			});
			embedText = "";
		}

		// Update text
		embedText += addText;
	}
	// Push final field
	storedFields.push({
		name: fieldTitle,
		value: embedText,
		inline: true,
	});

	// Return
	return storedFields;
}
