import GUI from "lil-gui";

const DEFAULT_TIMESTEP = 40;

export const simParams = {
	timestep: DEFAULT_TIMESTEP,
	paused: false,
};

const gui = new GUI({ title: "Settings", width: 280 });
gui.add(simParams, "timestep", 1, 2000, 1).name("CA timestep (ms)");
gui.add(simParams, "paused").name("Pause");
