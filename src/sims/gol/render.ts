import type { SimContext } from "../ca_sim";
import type { Camera } from "./camera";
import type { SimResources, SimState } from "./main";
import shaderCode from "./shaders/render.wgsl?raw";

let bindGroup: GPUBindGroup;
let pipeline: GPURenderPipeline;

export function initRender(camera: Camera, ctx: SimContext, res: SimResources) {
	const shaderModule = ctx.device.createShaderModule({ code: shaderCode });

	const sampler = ctx.device.createSampler({
		label: "Render Sampler",
		addressModeU: "repeat",
		addressModeV: "repeat",
	});

	const cameraStateBufferSize =
		1 * 4 + // f32 for zoom
		2 * 4 + // 2 f32's for offset
		1 * 4; // f32 for aspectRatio
	const cameraStateBuffer = ctx.device.createBuffer({
		label: "Camera Uniform Buffer",
		size: cameraStateBufferSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	const cameraStateValues = new Float32Array(cameraStateBufferSize / 4);
	cameraStateValues.set([
		camera.zoom,
		camera.offsetX,
		camera.offsetY,
		camera.aspectRatio,
	]);

	const bindGroupLayout = ctx.device.createBindGroupLayout({
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
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	});

	bindGroup = ctx.device.createBindGroup({
		label: "Render Bind Group",
		layout: bindGroupLayout,
		entries: [
			{
				binding: 0,
				resource: res.computeOutTexture,
			},
			{
				binding: 1,
				resource: sampler,
			},
			{
				binding: 2,
				resource: cameraStateBuffer,
			},
		],
	});

	function updateCameraBuffer() {
		cameraStateValues.set([
			camera.zoom,
			camera.offsetX,
			camera.offsetY,
			camera.aspectRatio,
		]);
		ctx.device.queue.writeBuffer(cameraStateBuffer, 0, cameraStateValues);
	}
	// Initializing unform buffer on the GPU.
	updateCameraBuffer();
	camera.onChange = updateCameraBuffer;

	const pipelineLayout = ctx.device.createPipelineLayout({
		label: "Render Pipeline Layout",
		bindGroupLayouts: [bindGroupLayout],
	});

	pipeline = ctx.device.createRenderPipeline({
		label: "Render Pipeline",
		layout: pipelineLayout,
		vertex: { module: shaderModule, entryPoint: "vs_main" },
		fragment: {
			module: shaderModule,
			entryPoint: "fs_main",
			targets: [{ format: ctx.format }],
		},
		primitive: {
			topology: "triangle-list",
		},
	});
}

export function renderPass(
	encoder: GPUCommandEncoder,
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
