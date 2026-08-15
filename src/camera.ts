export class Camera {
	zoom = 1.0;
	offsetX = 0;
	offsetY = 0;
	aspectRatio = 1.0;
	private isDragging = false;
	private draggingSpeed = 0.01;
	private lastX = 0;
	private lastY = 0;

	constructor(
		private canvas: HTMLCanvasElement,
		private window: Window,
	) {
		this.setupEvents();
	}

	private setupEvents() {
		this.window.addEventListener("resize", () => {
			// aspectRatio, defined in this way doesn't change scale if only the width is changed.
			this.aspectRatio = this.canvas.height / this.canvas.width;
			this.onChange();
		});

		this.canvas.addEventListener("mousedown", (e) => {
			if (e.button === 0) {
				this.isDragging = true;
				this.lastX = e.clientX;
				this.lastY = e.clientY;
				this.canvas.style.cursor = "grabbing";
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (!this.isDragging) return;
			const dx = e.clientX - this.lastX;
			const dy = e.clientY - this.lastY;
			this.lastX = e.clientX;
			this.lastY = e.clientY;

			this.offsetX += (dx * this.draggingSpeed) / this.zoom;
			this.offsetY += (dy * this.draggingSpeed) / this.zoom;
			this.onChange();
		});

		window.addEventListener("mouseup", () => {
			this.isDragging = false;
			this.canvas.style.cursor = "default";
		});

		this.canvas.addEventListener("wheel", (e) => {
			e.preventDefault();
			const factor = e.deltaY > 0 ? 0.9 : 1.1;
			this.zoom = Math.min(10, Math.max(0.1, this.zoom * factor));
			this.onChange();
		});
	}

	onChange() {
		// updating uniform values
	}
}
