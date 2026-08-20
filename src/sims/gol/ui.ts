import GUI from "lil-gui";

import type { SimParams } from "./main";

const DEFAULT_TIMESTEP = 40;

export const simParams: SimParams = {
	timestep: DEFAULT_TIMESTEP,
	paused: false,
};

const gui = new GUI({ title: "Settings", width: 280 });
gui.add(simParams, "timestep", 1, 2000, 1).name("CA timestep (ms)");
gui.add(simParams, "paused").name("Pause");

// Hopefully, it gets the same adapter as the one, we get in project's `main`.
// TODO pass the actual used adapter reference here somehow.
const adapter =
	(await navigator.gpu.requestAdapter()) ??
	(() => {
		throw new Error("No adapter found");
	})();
const infoFolder = gui.addFolder("Adapter Info");
infoFolder.add(adapter.info, "vendor").name("Vendor").disable();
infoFolder.add(adapter.info, "architecture").name("Arch").disable();
infoFolder.add(adapter.info, "device").name("Device").disable();
infoFolder.add(adapter.info, "description").name("Description").disable();
infoFolder.close();
