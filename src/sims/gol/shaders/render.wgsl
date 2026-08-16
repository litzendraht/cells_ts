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

fn blend_border_tint(tex_coords: vec2f, source_color: vec4f) -> vec4f {
    const margin = 0.005;
    const tint_color = vec4f(0.0, 0.75, 0.0, 1.0);
    let mod_tex_coords = tex_coords  - floor(tex_coords);

    if (min(1.0 - mod_tex_coords.x, mod_tex_coords.x) < margin) || (min(1.0 - mod_tex_coords.y, mod_tex_coords.y) < margin) {
        // If close to border, blending with the red color.
        let dist = min(
            min(1.0 - mod_tex_coords.x, mod_tex_coords.x),
            min(1.0 - mod_tex_coords.y, mod_tex_coords.y)
        );
        // Blend strength - strongest at the border, when dist = 0.0.
        let alpha = clamp((margin - dist) / margin, 0.0, 1.0);
        return alpha * tint_color + (1.0 - alpha) * source_color;
    } else {
        return source_color;
    }
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
    return blend_border_tint(corrected_tex_coords, textureSample(in_texture, in_sampler, corrected_tex_coords));
    // return textureSample(in_texture, in_sampler, corrected_tex_coords);
}
