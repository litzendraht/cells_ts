@group(0) @binding(0)
var in_texture: texture_2d<f32>;
@group(0) @binding(1)
var in_sampler: sampler;

struct CameraState {
    zoom: f32,
    offset: vec2f,
}

@group(0) @binding(2)
var<uniform> camera_state: CameraState;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) clip_pos: vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VertexOutput {
    let pos = array(
        vec2f( 1.0,  1.0),
        vec2f(-1.0,  1.0),
        vec2f(-1.0, -1.0),
        vec2f(-1.0, -1.0),
        vec2f( 1.0, -1.0),
        vec2f( 1.0,  1.0)
    );
    return VertexOutput(vec4f(pos[idx], 0.0, 1.0), (pos[idx] + vec2f(1.0, 1.0)) / 2.0);
}

@fragment
fn fs_main(@location(0) tex_coords: vec2f) -> @location(0) vec4f {
    let corrected_tex_coords = tex_coords + camera_state.offset;
    return textureSample(in_texture, in_sampler, corrected_tex_coords);
}
