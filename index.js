require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('node:fs');
const path = require('node:path');
const args = require('./scripts/args.js');
const tokens = require('./tokens.json');

puppeteer.use(StealthPlugin());

(async () => {
	const browser = await puppeteer.launch({
		headless: process.env.NODE_ENV === 'production',
		args,
	});

	const totalRooms = process.env.ROOMS ? parseInt(process.env.ROOMS, 10) : 1;

	const initializeRoom = async (browserInstance, roomIndex) => {
		const roomId = roomIndex + 1;

		const pages = await browserInstance.pages();
		const page = roomIndex === 0 ? pages[0] : await browserInstance.newPage();
		page.on('console', msg => {
			console.log(`#${roomId}:`, msg.text());
		});

		await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle0' });

		const roomName = process.env[`ROOM_NAME_${roomId}`];
		const roomToken = tokens[roomIndex];
		if (!roomToken) throw new Error(`Missing token for ${roomId}`);

		const scriptContent = fs
			.readFileSync(path.resolve('scripts', 'room.js'), 'utf-8')
			.replace('<ROOM_NAME>', roomName)
			.replace('<PASSWORD>', process.env.PASSWORD)
			.replace('<TOKEN>', roomToken)
			.replace('<LAT>', process.env[`LAT_${roomId}`])
			.replace('<LON>', process.env[`LON_${roomId}`]);

		await page.evaluate(injectedScript => {
			const scriptElement = document.createElement('script');
			scriptElement.textContent = injectedScript;
			document.body.appendChild(scriptElement);
		}, scriptContent);

		console.log(`Initialized room: ${roomName} (${roomToken})`);
	};

	for (let i = 0; i < totalRooms; i++) {
		await initializeRoom(browser, i);
	}
})();
