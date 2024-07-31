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
		// Cache
		if (request.method.toUpperCase() === "GET") {
			const cacheUrl = new URL(request.url);
			// Convert to a GET to be able to cache
			const cacheKey = new Request(cacheUrl.toString(), {
			  headers: request.headers,
			  method: "GET",
			});
	
			const cache = caches.default;
			console.log(cache);
			// Find the cache key in the cache
			let response = await cache.match(cacheKey);
			if (!response) {
				response = await fetch(request);
				cache.put(cacheKey, response.clone());
			} else {
				console.log("fetch cached");
			}
			return response.json();
		}
		
		// Fetch
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
