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
	await wait(500);
	container.classList.remove("idle");
	for (let line of text) {
		container.textContent = "";
		for (let char of line) {
			container.textContent += char;
			let waitTime = Math.random() * 20 + 100;
			if ([",", ".", "!", "?", "\n"].indexOf(char) !== -1) {
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

function generateCountdownText(): string {
	const date = moment("2017-10-13");
	let days = date.diff(moment(), "days");
	if (days < 0) {
		return "Thanks for coming!";
	}
	return `${days} day${days === 1 ? "" : "s"} remaining`;
}

window.onload = async () => {
	await writeText(document.getElementById("system-active")!, [
		"// HackGT System Active"
	]);
};
