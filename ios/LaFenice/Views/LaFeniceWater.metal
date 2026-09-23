#include <metal_stdlib>
using namespace metal;

// Bounded optical light ripple over the existing photograph, not fluid transport.
[[ stitchable ]] half4 feniceWater(float2 position, half4 color, float2 size, float elapsed, float2 origin) {
    float time = clamp(elapsed, 0.0, 2.4);
    float envelope = sin(M_PI_F * time / 2.4);
    float distance = length(position - origin) / max(size.y, 1.0);
    float ring = sin(distance * 34.0 - time * 11.0) * exp(-distance * 1.5);
    float caustic = sin(position.x * 0.058 + sin(position.y * 0.04) * 1.6 - time * 1.8);
    float2 uv = position / max(size, float2(1.0));
    float sea = smoothstep(0.23, 0.38, uv.x) * (1.0 - smoothstep(0.64, 0.78, uv.x));
    sea *= smoothstep(0.02, 0.16, uv.y) * (1.0 - smoothstep(0.83, 1.0, uv.y));
    float light = (ring * 0.09 + caustic * 0.035) * envelope * sea;
    half3 result = clamp(color.rgb + half3(light * 0.65, light * 0.9, light), half3(0), half3(color.a));
    return half4(result, color.a);
}
