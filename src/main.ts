import './style.css';

async function init() {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported. Включи флаги в браузере или используй Chrome 113+');
  }

  const adapter = await navigator.gpu.requestAdapter() ?? (() => { throw new Error('No adapter found'); })();
  const device = await adapter.requestDevice();
  const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;
  const context = canvas.getContext('webgpu') ?? (() => { throw new Error('No WebGPU context'); })();
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
  });

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
  }

  resizeCanvas();

  const shaderCode = `
    @vertex
    fn vs_main(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4f {
      var pos = array<vec2f, 3>(
        vec2f( 0.0,  0.5),
        vec2f(-0.5, -0.5),
        vec2f( 0.5, -0.5)
      );
      return vec4f(pos[idx], 0.0, 1.0);
    }

    @fragment
    fn fs_main() -> @location(0) vec4f {
      return vec4f(1.0, 0.0, 0.0, 1.0); // красный треугольник
    }
  `;

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: 'vs_main',
    },
    fragment: {
      module: device.createShaderModule({ code: shaderCode }),
      entryPoint: 'fs_main',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  function frame() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.1, g: 0.2, b: 0.3, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    resizeCanvas();
  });
}

init().catch(console.error);