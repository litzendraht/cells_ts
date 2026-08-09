import shaderCode from "./shaders/compute.wgsl?raw";

import type { SimulationState } from "./state";

export const WORKGROUP_SIZE = 16;

const getRandomBoolean = (): boolean => Math.random() < 0.5;

let bindGroup: GPUBindGroup;
let pipeline: GPUComputePipeline;

export function initCompute(state: SimulationState) {
	const shaderModule = state.device.createShaderModule({ code: shaderCode });

	const DATA_SIZE = state.gridSize * state.gridSize;
	const data = new Uint8Array(DATA_SIZE * 4);
	for (let i = 0; i < DATA_SIZE; i++) {
		const white = getRandomBoolean();
		const value = white ? 255 : 0;
		const offset = i * 4;
		data[offset] = value;
		data[offset + 1] = value;
		data[offset + 2] = value;
		data[offset + 3] = 255;
	}

	state.device.queue.writeTexture(
		{
			texture: state.computeInTexture,
		},
		data,
		{
			bytesPerRow: state.gridSize * 4,
			rowsPerImage: state.gridSize,
		},
		{
			width: state.gridSize,
			height: state.gridSize,
		},
	);

	const bindGroupLayout = state.device.createBindGroupLayout({
		label: "Compute Bind Group Layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				storageTexture: {
					format: "rgba8unorm",
					access: "read-only",
				},
			},
			{
				binding: 1,
				visibility: GPUShaderStage.COMPUTE,
				storageTexture: {
					format: "rgba8unorm",
					access: "write-only",
				},
			},
		],
	});

	bindGroup = state.device.createBindGroup({
		label: "Compute Bind Group",
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: state.computeInTexture,
			},
			{
				binding: 1,
				resource: state.computeOutTexture,
			},
		],
	});

	const pipelineLayout = state.device.createPipelineLayout({
		label: "Compute Pipeline Layout",
		bindGroupLayouts: [bindGroupLayout],
	});

	pipeline = state.device.createComputePipeline({
		label: "Compute Pipeline",
		layout: pipelineLayout,
		compute: {
			module: shaderModule,
			entryPoint: "main",
		},
	});
}

export function computePass(
	encoder: GPUCommandEncoder,
	state: SimulationState,
) {
	const pass = encoder.beginComputePass();
	pass.setPipeline(pipeline);
	pass.setBindGroup(0, bindGroup);
	pass.dispatchWorkgroups(
		Math.ceil(state.gridSize / 16),
		Math.ceil(state.gridSize / 16),
	);
	pass.end();

	encoder.copyTextureToTexture(
		{
			texture: state.computeOutTexture,
		},
		{
			texture: state.computeInTexture,
		},
		{
			width: state.gridSize,
			height: state.gridSize,
			depthOrArrayLayers: 1,
		},
	);
}
