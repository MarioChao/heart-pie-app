// Fetch functions
async function fetchUrl(apiUrl, urlParameters, requestOptions) {
	// Put parameters
	if (urlParameters) {
		const searchParams = new URLSearchParams(urlParameters);
		apiUrl += "?" + searchParams.toString();
	}
	console.log("Fetching");

	const request = new Request(apiUrl, requestOptions);

	// Fetch
	try {
		const response = await fetch(request);
		if (!response.ok) {
			throw new Error("Could not fetch resources");
		}

		const data = await response.json();
		return data;

	} catch (error) {
		throw error;
	}
}

// Function module
const functionModule = {
	fetchUrl : fetchUrl,
}

export { functionModule };
