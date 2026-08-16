export interface SimContext {
	window: Window; // TODO not sure that window is needed.
	canvas: HTMLCanvasElement; // Target canvas for rendering.
	format: GPUTextureFormat;
	gpuContext: GPUCanvasContext;
	device: GPUDevice;
}

export abstract class CASim {
	name: string = "Default Name";
	protected ctx: SimContext;

	constructor(ctx: SimContext) {
		this.ctx = ctx;
	}

	// Assuming that this will be called upstream each frame.
	abstract frame(): void;
}
