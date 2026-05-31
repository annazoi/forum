const RSS_FEEDS = [
	{ source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
	{ source: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
];

const CACHE_TTL_MS = 15 * 60 * 1000;

let cache = {
	items: [],
	expiresAt: 0,
};

function decodeHtml(text) {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function extractTag(block, tag) {
	const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, 's');
	const plain = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
	const match = block.match(cdata) || block.match(plain);
	return match ? match[1].trim() : '';
}

function parseRssItems(xml) {
	const items = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let match;

	while ((match = itemRegex.exec(xml)) !== null) {
		const block = match[1];
		const title = extractTag(block, 'title');
		const link = extractTag(block, 'link');
		const pubDate = extractTag(block, 'pubDate');

		if (!title || !link) continue;

		items.push({
			title: decodeHtml(title),
			link: decodeHtml(link),
			pubDate: pubDate ? new Date(pubDate).toISOString() : null,
		});
	}

	return items;
}

async function fetchFeed(feed) {
	const response = await fetch(feed.url, {
		headers: { 'User-Agent': 'Relay/1.0 (news sidebar)' },
	});

	if (!response.ok) {
		throw new Error(`Feed ${feed.source} returned ${response.status}`);
	}

	const xml = await response.text();
	return parseRssItems(xml).map((item) => ({
		...item,
		source: feed.source,
	}));
}

async function loadHeadlines() {
	const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
	const merged = results
		.filter((result) => result.status === 'fulfilled')
		.flatMap((result) => result.value)
		.filter((item) => item.pubDate)
		.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

	const seen = new Set();
	const unique = [];

	for (const item of merged) {
		const key = item.title.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
		if (unique.length >= 6) break;
	}

	if (unique.length === 0) {
		throw new Error('No headlines available');
	}

	return unique;
}

exports.getHeadlines = async (req, res) => {
	try {
		const now = Date.now();

		if (cache.items.length && cache.expiresAt > now) {
			return res.json({ items: cache.items, cached: true });
		}

		const items = await loadHeadlines();

		cache = {
			items,
			expiresAt: now + CACHE_TTL_MS,
		};

		res.json({ items, cached: false });
	} catch (err) {
		if (cache.items.length) {
			return res.json({ items: cache.items, cached: true, stale: true });
		}

		res.status(503).json({ message: 'Could not load world news' });
	}
};
