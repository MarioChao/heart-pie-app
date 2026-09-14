// Fetch functions

async function fetchUrl(apiUrl, urlParameters, requestOptions) {
	// Put parameters
	if (urlParameters) {
		const searchParams = new URLSearchParams(urlParameters);
		apiUrl += "?" + searchParams.toString();
	}
	console.log(`[fetch-api]: Fetching ${apiUrl}...`);

	const request = new Request(apiUrl, requestOptions);

	// Fetch
	try {
		// Cache
		if (request.method.toUpperCase() === "GET") {
			const cacheUrl = new URL(request.url);
			// Convert to a GET to be able to cache
			const cacheKey = new Request(cacheUrl.toString(), {
			  headers: request.headers,
			  method: "GET",
			});

			const cache = caches.default;
			
			// Find the cache key in the cache
			let response = await cache.match(cacheKey);
			if (response) {
				console.log(`[fetch-api]: Cached result: '${cache}'`);
			} else {
				response = await fetch(request);
				if (!response.ok) {
					console.error(`[fetch-api]: Could not fetch resources for ${apiUrl}.`)
					throw new Error("[fetch-api]: Could not fetch resources.");
				}
				cache.put(cacheKey, response.clone());
			}
			const data = await response.json();
			console.log("[fetch-api]: Cached fetch json successful.");
			return data;
		}
		
		// Fetch
		const response = await fetch(request);
		if (!response.ok) {
			console.error(`[fetch-api]: Could not fetch resources for ${apiUrl}.`)
			throw new Error("[fetch-api]: Could not fetch resources.");
		}

		const data = await response.json();
		console.log(`[fetch-api]: Fetch json successful.`)
		return data;

	} catch (error) {
		console.error(`[fetch-api]: Error occured: ${error}`)
		throw error;
	}
}

// Function module
const functionModule = {
	fetchUrl : fetchUrl,
}

export { functionModule };
