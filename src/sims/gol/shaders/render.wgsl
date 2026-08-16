@group(0) @binding(0)
var in_texture: texture_2d<f32>;
@group(0) @binding(1)
var in_sampler: sampler;

struct CameraState {
    zoom: f32,
    offset_x: f32,
    offset_y: f32,
    aspect_ratio: f32,
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
    var corrected_tex_coords = (tex_coords - vec2f(0.5, 0.5)) / camera_state.zoom + vec2f(0.5, 0.5) - vec2f(camera_state.offset_x, -camera_state.offset_y);
    corrected_tex_coords.x = corrected_tex_coords.x / camera_state.aspect_ratio;
    return textureSample(in_texture, in_sampler, corrected_tex_coords);
}
