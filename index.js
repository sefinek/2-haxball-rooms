require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('node:fs');
const path = require('node:path');
const args = require('./scripts/args.js');
const getToken = require('./services/getToken.js');

puppeteer.use(StealthPlugin());

(async () => {
	const browser = await puppeteer.launch({ headless: process.env.NODE_ENV === 'production', args });
	const totalRooms = process.env.ROOMS ? parseInt(process.env.ROOMS, 10) : 1;

	const initializeRoom = async (browserInstance, roomIndex) => {
		const roomId = roomIndex + 1;

		const roomName = process.env[`ROOM_NAME_${roomId}`];
		const token = await getToken(roomId);
		if (!token) throw new Error(`Missing token for ${roomId}`);

		const pages = await browserInstance.pages();
		const page = roomIndex === 0 ? pages[0] : await browserInstance.newPage();
		page.on('console', msg => console.log(`#${roomId}:`, msg.text()));

		await page.goto('https://www.haxball.com/headless', { waitUntil: 'networkidle0' });

		const scriptContent = fs
			.readFileSync(path.resolve('scripts', 'room.js'), 'utf-8')
			.replace('<ROOM_NAME>', roomName)
			.replace('<PASSWORD>', process.env.PASSWORD)
			.replace('<TOKEN>', token)
			.replace('\'<LAT>\'', process.env[`LAT_${roomId}`])
			.replace('\'<LON>\'', process.env[`LON_${roomId}`]);

		await page.evaluate(injectedScript => {
			const scriptElement = document.createElement('script');
			scriptElement.textContent = injectedScript;
			document.body.appendChild(scriptElement);
		}, scriptContent);

		console.log(`Initialized room: ${roomName} (${token})`);
	};

	for (let i = 0; i < totalRooms; i++) {
		await initializeRoom(browser, i);
	}
})();
