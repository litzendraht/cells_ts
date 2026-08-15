export interface SimulationState {
	device: GPUDevice;
	gridSize: number;
	computeInTexture: GPUTexture;
	computeOutTexture: GPUTexture;
}

export interface CameraState {
	zoom: number;
	// (x, y) shift of the viewport ralative to the center of the rendered CA texture.
	offsetX: number;
	offsetY: number;
	isDragging: boolean;
}
