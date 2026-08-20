import "./style.css";

import { Sim } from "./sims/gol/main";
import type { SimContext } from "./sims/sim";

async function buildSimContext(): Promise<SimContext> {
	if (!navigator.gpu) {
		throw new Error(
			"WebGPU not supported. Enable browser flags or use Chrome 113+",
		);
	}

	const canvas = document.getElementById("gpu-canvas") as HTMLCanvasElement;
	const context =
		canvas.getContext("webgpu") ??
		(() => {
			throw new Error("No WebGPU context");
		})();
	const adapter =
		(await navigator.gpu.requestAdapter()) ??
		(() => {
			throw new Error("No adapter found");
		})();
	const device = await adapter.requestDevice();
	const format = navigator.gpu.getPreferredCanvasFormat();
	context.configure({ device, format });

	return {
		window,
		canvas,
		format,
		gpuContext: context,
		device,
	};
}

async function main() {
	const simContext = await buildSimContext();
	const sim = new Sim(simContext);

	function frame() {
		sim.frame();
		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}

main();
