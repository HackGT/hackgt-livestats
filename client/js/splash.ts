declare const moment: any;
declare const io: any;
function wait(milliseconds: number) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, milliseconds);
	});
}

async function writeText(container: HTMLElement, text: string[], overwrite: boolean = true, lineWaitTime: number = 1000): Promise<{ close: () => void }> {
	const closeFunction = () => container.classList.add("hide-cursor");
	
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

	return { close: closeFunction };
}

window.onload = async () => {
	startWebSocketListener();
};

// Listen for updates
async function startWebSocketListener() {
	const eventInfo = document.getElementById("event-info")!;
	const systemActive = document.getElementById("system-active")!;
	const status = document.getElementById("status")!;
	const count = document.getElementById("count")!;

	(await writeText(systemActive, [
		"// HackGT v4 system initialized"
	])).close();
	(await writeText(eventInfo, [
		"// Check out live.hack.gt for event info",
		"// Loading opening ceremony..."
	], false)).close();

	let socket = io();
	socket.on("connect", () => {
		console.log("Connection established");
	});

	let currentUserCount: number = -1;
	socket.on("count-update", async (data: any) => {
		if (data.count !== currentUserCount) {
			currentUserCount = data.count;
			(await writeText(count, [
				`${data.count.toLocaleString()} users loaded`
			])).close();
		}
	});

	socket.on("users-update", async (data: { new: boolean, users: string[]; }) => {
		if (!data.new && data.users.length > 0) {
			// Otherwise will present wayyyy to many users on page load if many people are checked in already
			data.users = [data.users.pop()!];
		}
		
		for (let user of data.users as string[]) {
			if (user.trim().length === 0) {
				continue;
			}
			await writeText(status, [
				`Welcome ${user}!`
			]);
		}
	});
	
	socket.on("disconnect", () => {
		console.warn("Socket closed unexpectedly");
	});
}
