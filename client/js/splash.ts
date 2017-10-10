declare const moment: any;
declare const io: any;
function wait(milliseconds: number) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, milliseconds);
	});
}

async function writeText(container: HTMLElement, text: string[], overwrite: boolean = true, lineWaitTime: number = 1000): Promise<{ finish: () => void }> {
	const finishFunction = () => container.classList.add("hide-cursor");

	container.classList.remove("hide-cursor");
	await wait(500);
	container.classList.remove("idle");

	let innerContainer = overwrite ? container : document.createElement("span");
	if (!overwrite) {
		container.appendChild(innerContainer);
	}
	for (let i = 0; i < text.length; i++) {
		let line = text[i];
		innerContainer.textContent = "";
		for (let char of line) {
			innerContainer.textContent += char;
			let waitTime = Math.random() * 20 + 100;
			if (["/", ",", ".", "!", "?", "\n"].indexOf(char) !== -1) {
				waitTime *= 3;
			}
			await wait(waitTime);
		}
		container.classList.add("idle");
		await wait(lineWaitTime);
		if (!overwrite) {
			if (i !== text.length - 1) {
				innerContainer.appendChild(document.createElement("br"));
			}
			innerContainer = document.createElement("span");
			container.appendChild(innerContainer);
		}
		container.classList.remove("idle");
	}
	container.classList.add("idle");
	await wait(500);

	return { finish: finishFunction };
}

window.onload = async () => {
	startWebSocketListener().catch(err => {
		throw err;
	});
};

// Listen for updates
async function startWebSocketListener() {
	const eventInfo = document.getElementById("event-info")!;
	const systemActive = document.getElementById("system-active")!;
	const status = document.getElementById("status")!;
	const count = document.getElementById("count")!;

	(await writeText(systemActive, [
		"// HackGT v4 system initialized"
	])).finish();
	(await writeText(eventInfo, [
		"// Check out live.hack.gt for event info",
		"// Loading opening ceremony..."
	], false)).finish();

	let socket = io();
	socket.on("connect", () => {
		console.log("Connection established");
	});

	let currentUserCount: number = -1;
	let countUpdating = false;
	socket.on("count-update", async (data: any) => {
		console.info("count-update", data);
		if (data.count !== currentUserCount && !countUpdating) {
			countUpdating = true;
			currentUserCount = data.count;
			(await writeText(count, [
				`${data.count.toLocaleString()} users loaded`
			])).finish();
			countUpdating = false;
		}
	});

	let pendingUsers: string[] = [];
	let usersUpdating = false;
	socket.on("users-update", async (data: { new: boolean; users: string[] }) => {
		console.info("users-update", data);
		if (!data.new && data.users.length > 0) {
			// Otherwise will present wayyyy to many users on page load if many people are checked in already
			data.users = [data.users.pop()!];
		}

		if (usersUpdating) {
			pendingUsers.push(...data.users);
			return;
		}

		usersUpdating = true;
		for (let user of pendingUsers.concat(data.users)) {
			if (user.trim().length === 0) {
				continue;
			}
			await writeText(status, [
				`Welcome ${user}!`
			]);
		}
		usersUpdating = false;
		pendingUsers = [];
	});

	socket.on("disconnect", () => {
		console.warn("Socket closed unexpectedly");
	});
}
