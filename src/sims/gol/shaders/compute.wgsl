@group(0) @binding(0) 
var in_texture: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) 
var out_texture: texture_storage_2d<rgba8unorm, write>;

const ALIVE_COLOR = vec4f(1.0, 1.0, 1.0, 1.0);
const DEAD_COLOR = vec4f(0.0, 0.0, 0.0, 1.0);

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
    let dimensions = textureDimensions(out_texture);
    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) { 
        return; 
    }
    let out_coords = vec2i(i32(global_id.x), i32(global_id.y));

    let shifts = array(
        vec2i( 1,  0),
        vec2i( 1,  1),
        vec2i( 0,  1),
        vec2i(-1,  1),
        vec2i(-1,  0),
        vec2i(-1, -1),
        vec2i( 0, -1),
        vec2i( 1, -1)
    );
    var alive_count: u32 = 0;
    for (var i = 0; i < 8; i++) {
        let x = (out_coords.x + shifts[i].x) % i32(dimensions.x);
        let y = (out_coords.y + shifts[i].y) % i32(dimensions.y);
        let shift_coords = vec2i(x, y);
        let shift_value = textureLoad(in_texture, shift_coords);
        // If cell is alive, alive color was stored in the texel.
        if all(shift_value == ALIVE_COLOR) {
            alive_count += 1;
        }
    }

    let in_value = textureLoad(in_texture, out_coords);
    if all(in_value == ALIVE_COLOR) {
        if (alive_count < 2) || (alive_count > 3) {
            textureStore(out_texture, out_coords, DEAD_COLOR);
        } else {
            textureStore(out_texture, out_coords, ALIVE_COLOR);
        }
    } else {
        if alive_count == 3 {
            textureStore(out_texture, out_coords, ALIVE_COLOR);
        }
    }
}
