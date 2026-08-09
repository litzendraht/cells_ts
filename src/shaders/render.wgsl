@group(0) @binding(0)
var in_texture: texture_2d<f32>;
@group(0) @binding(1)
var in_sampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) clip_pos: vec2<f32>,
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
fn fs_main(@location(0) tex_coords: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(in_texture, in_sampler, tex_coords);
}
