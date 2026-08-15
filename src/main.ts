import "./style.css";

import { WORKGROUP_SIZE } from "./compute";

const GRID_SIZE = 512;

import { Camera } from "./camera";
import { computePass, initCompute } from "./compute";
import { initRender, renderPass } from "./render";
import type { SimulationState } from "./state";
import { simParams } from "./ui";

// CA step timekeeping.
// TODO seems ugly to hold this in a global outside main.
let lastFrameTime = performance.now();
let timeSinceLastStep = 0;

async function main() {
	if (!navigator.gpu) {
		throw new Error(
			"WebGPU not supported. Enable browser flags or use Chrome 113+",
		);
	}

	if (GRID_SIZE % WORKGROUP_SIZE !== 0) {
		throw new Error(`GRID_SIZE must be divisible by WORKGROUP_SIZE`);
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

	// UGLY I don't like how these textures leak between different stages.
	const computeInTexture = device.createTexture({
		label: "Compute In Texture",
		size: [GRID_SIZE, GRID_SIZE, 1],
		format: "rgba8unorm",
		usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
	});

	const computeOutTexture = device.createTexture({
		label: "Compute Out Texture",
		size: [GRID_SIZE, GRID_SIZE, 1],
		format: "rgba8unorm",
		usage:
			GPUTextureUsage.TEXTURE_BINDING |
			GPUTextureUsage.STORAGE_BINDING |
			GPUTextureUsage.COPY_SRC,
	});

	const simulationState: SimulationState = {
		device,
		gridSize: GRID_SIZE,
		computeInTexture,
		computeOutTexture,
	};

	const camera = new Camera(canvas, window);

	initCompute(simulationState);
	initRender(camera, simulationState, format);

	function resizeCanvas() {
		const dpr = window.devicePixelRatio || 1;
		const displayWidth = window.innerWidth;
		const displayHeight = window.innerHeight;

		canvas.width = displayWidth * dpr;
		canvas.height = displayHeight * dpr;
	}

	window.addEventListener("resize", () => {
		resizeCanvas();
	});

	function frame() {
		const encoder = device.createCommandEncoder();

		const delta = performance.now() - lastFrameTime;
		lastFrameTime = performance.now();

		if (!simParams.paused) {
			timeSinceLastStep += delta;

			if (timeSinceLastStep >= simParams.timestep) {
				console.log("CA step");
				computePass(encoder, simulationState);
				timeSinceLastStep = 0;
			}
		}
		renderPass(encoder, simulationState, context);

		device.queue.submit([encoder.finish()]);
		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);
}

main();
