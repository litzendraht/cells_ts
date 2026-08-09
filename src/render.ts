import shaderCode from "./shaders/render.wgsl?raw";

import type { SimulationState } from "./state";

let bindGroup: GPUBindGroup;
let pipeline: GPURenderPipeline;

export function initRender(
	state: SimulationState,
	canvasFormat: GPUTextureFormat,
) {
	const shaderModule = state.device.createShaderModule({ code: shaderCode });

	const sampler = state.device.createSampler({
		label: "Render Sampler",
	});

	const bindGroupLayout = state.device.createBindGroupLayout({
		label: "Render Bind Group Layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {},
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {},
			},
		],
	});

	bindGroup = state.device.createBindGroup({
		label: "Render Bind Group",
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: state.computeOutTexture,
			},
			{
				binding: 1,
				resource: sampler,
			},
		],
	});

	const pipelineLayout = state.device.createPipelineLayout({
		label: "Render Pipeline Layout",
		bindGroupLayouts: [bindGroupLayout],
	});

	pipeline = state.device.createRenderPipeline({
		label: "Render Pipeline",
		layout: pipelineLayout,
		vertex: { module: shaderModule, entryPoint: "vs_main" },
		fragment: {
			module: shaderModule,
			entryPoint: "fs_main",
			targets: [{ format: canvasFormat }],
		},
		primitive: {
			topology: "triangle-list",
		},
	});
}

export function renderPass(
	encoder: GPUCommandEncoder,
	state: SimulationState,
	context: GPUCanvasContext,
) {
	const textureView = context.getCurrentTexture().createView();
	const pass = encoder.beginRenderPass({
		colorAttachments: [
			{ view: textureView, loadOp: "clear", storeOp: "store" },
		],
	});
	pass.setPipeline(pipeline);
	pass.setBindGroup(0, bindGroup);
	pass.draw(6);
	pass.end();
}
