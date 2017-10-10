declare const moment: any;

function wait(milliseconds: number) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, milliseconds);
	});
}

let writeTextRunning: boolean = false;
async function writeText(container: HTMLElement, text: string[], lineWaitTime: number = 1000) {
	if (writeTextRunning) return;
	writeTextRunning = true;
	container.classList.remove("hide-cursor");
	await wait(500);
	container.classList.remove("idle");
	for (let line of text) {
		container.textContent = "";
		for (let char of line) {
			container.textContent += char;
			let waitTime = Math.random() * 20 + 100;
			if (["/", ",", ".", "!", "?", "\n"].indexOf(char) !== -1) {
				waitTime *= 3;
			}
			await wait(waitTime);
		}
		container.classList.add("idle");
		await wait(lineWaitTime);
		container.classList.remove("idle");
	}
	container.classList.add("idle");
	await wait(500);
	writeTextRunning = false;
}

window.onload = async () => {
	startWebSocketListener();
	const systemActive = document.getElementById("system-active")!;
	const status = document.getElementById("status")!;

	await writeText(systemActive, [
		"// HackGT system active"
	]);
	await writeText(status, [
		"Stuff!"
	]);
};

// Listen for updates
const wsProtocol = location.protocol === "http:" ? "ws" : "wss";
function startWebSocketListener() {
	const socket = new WebSocket(`${wsProtocol}://${window.location.host}`);
	socket.addEventListener("message", event => {
		console.log(event.data);
	});
	socket.addEventListener("error", async event => {
		console.warn("Socket encountered an error, restarting...:", event);
		await wait(1000);
		startWebSocketListener();
	});
	socket.addEventListener("close", async event => {
		console.warn("Socket closed unexpectedly");
		await wait(1000);
		startWebSocketListener();
	});
}
