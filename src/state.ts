export interface SimulationState {
	device: GPUDevice;
	gridSize: number;
	computeInTexture: GPUTexture;
	computeOutTexture: GPUTexture;
}
