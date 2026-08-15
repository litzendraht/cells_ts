import type { Camera } from "./camera";
import shaderCode from "./shaders/render.wgsl?raw";
import type { SimulationState } from "./state";

let bindGroup: GPUBindGroup;
let pipeline: GPURenderPipeline;

export function initRender(
	camera: Camera,
	state: SimulationState,
	canvasFormat: GPUTextureFormat,
) {
	const shaderModule = state.device.createShaderModule({ code: shaderCode });

	const sampler = state.device.createSampler({
		label: "Render Sampler",
	});

	const cameraStateBufferSize =
		1 * 4 + // f32 for zoom
		2 * 4 + // 2 f32's for offset
		1 * 4; // padding
	const cameraStateBuffer = state.device.createBuffer({
		label: "Camera Uniform Buffer",
		size: cameraStateBufferSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	const cameraStateValues = new Float32Array(cameraStateBufferSize / 4);
	cameraStateValues.set([camera.zoom, camera.offsetX, camera.offsetY, 0]);

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
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
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
			{
				binding: 2,
				resource: cameraStateBuffer,
			},
		],
	});

	function updateCameraBuffer() {
		cameraStateValues.set([camera.zoom, camera.offsetX, camera.offsetY, 0]);
		state.device.queue.writeBuffer(cameraStateBuffer, 0, cameraStateValues);
	}
	camera.onChange = updateCameraBuffer;

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
