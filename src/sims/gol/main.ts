import { CASim, type SimContext } from "../ca_sim";
import { Camera } from "./camera";
import { computePass, initCompute, WORKGROUP_SIZE } from "./compute";
import { initRender, renderPass } from "./render";
import { simParams } from "./ui";

const DEFAULT_GRID_SIZE = 512;

export interface SimState {
	gridSize: number;
	// Frame scheduling.
	lastFrameTime: number;
	timeSinceLastStep: number;
}

export interface SimResources {
	computeInTexture: GPUTexture;
	computeOutTexture: GPUTexture;
}

export interface SimParams {
	timestep: number;
	paused: boolean;
}

export class Sim extends CASim {
	state: SimState;
	params: SimParams;
	// Shared storage for textures, used between stages.
	resources: SimResources;

	constructor(ctx: SimContext) {
		super(ctx);
		this.name = "Game of Life";
		this.state = {
			gridSize: DEFAULT_GRID_SIZE,
			lastFrameTime: performance.now(),
			timeSinceLastStep: 0,
		};

		if (this.state.gridSize % WORKGROUP_SIZE !== 0) {
			throw new Error(`GRID_SIZE must be divisible by WORKGROUP_SIZE`);
		}

		this.params = simParams;

		const computeInTexture = this.ctx.device.createTexture({
			label: "Compute In Texture",
			size: [this.state.gridSize, this.state.gridSize, 1],
			format: "rgba8unorm",
			usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
		});

		const computeOutTexture = this.ctx.device.createTexture({
			label: "Compute Out Texture",
			size: [this.state.gridSize, this.state.gridSize, 1],
			format: "rgba8unorm",
			usage:
				GPUTextureUsage.TEXTURE_BINDING |
				GPUTextureUsage.STORAGE_BINDING |
				GPUTextureUsage.COPY_SRC,
		});

		this.resources = {
			computeInTexture,
			computeOutTexture,
		};

		const camera = new Camera(this.ctx.canvas, window);

		initCompute(this.state, this.ctx, this.resources);
		initRender(camera, this.ctx, this.resources);
	}

	frame() {
		const encoder = this.ctx.device.createCommandEncoder();

		const delta = performance.now() - this.state.lastFrameTime;
		this.state.lastFrameTime = performance.now();

		if (!this.params.paused) {
			this.state.timeSinceLastStep += delta;

			if (this.state.timeSinceLastStep >= simParams.timestep) {
				computePass(encoder, this.state, this.resources);
				this.state.timeSinceLastStep = 0;
			}
		}
		renderPass(encoder, this.ctx.gpuContext);

		this.ctx.device.queue.submit([encoder.finish()]);
	}
}
