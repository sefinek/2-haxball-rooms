const roomConfig = {
	roomName: '<ROOM_NAME>',
	maxPlayers: 1,
	public: true,
	password: '<PASSWORD>',
	playerName: 'SPERMOFILEK RS',
	token: '<TOKEN>',
	noPlayer: true,
	geo: { code: 'PL', lat: '<LAT>', lon: '<LON>' },
};

const room = HBInit(roomConfig);

room.onRoomLink = url => console.log(`Ready! ${url}`);
room.onPlayerJoin = p => console.log(`${p.name} joined the room.`);
room.onPlayerLeave = p => console.log(`${p.name} left the room.`);