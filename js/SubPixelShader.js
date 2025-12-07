/**
 * Sub-Pixel Art Rendering Algorithm Shader
 * 
 * This shader simulates a low-resolution display where individual R, G, B sub-pixels
 * are visible. It takes the high-res input, pixelates it, and then separates color
 * channels spatially within each "virtual pixel".
 */

export const SubPixelShader = {
    name: 'SubPixelShader',
    uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: null }, // Screen resolution
        'pixelSize': { value: 8.0 },   // Size of the virtual pixel
        'opacity': { value: 1.0 }
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float pixelSize;
        uniform float opacity;
        varying vec2 vUv;

        void main() {
            // Calculate the number of virtual pixels across the screen
            vec2 dUv = vUv * resolution;
            
            // Quantize UV coordinates to create the "big pixel" effect
            vec2 coord = floor(dUv / pixelSize) * pixelSize;
            
            // Sample the scene color at the center of the virtual pixel
            vec2 centeredUv = (coord + 0.5 * pixelSize) / resolution;
            vec4 texel = texture2D(tDiffuse, centeredUv);
            
            // Sub-pixel Logic
            // We want to simulate RGB stripes: R | G | B
            
            // Find position within the virtual pixel (0.0 to 1.0)
            vec2 subPos = mod(dUv, pixelSize) / pixelSize;
            
            vec3 color = vec3(0.0);
            
            // Define stripe width (with a little gap for the "grid" look)
            float gap = 0.1; 
            
            // Logic for vertical stripes
            if (subPos.x < 0.33) {
                // Red stripe
                if (subPos.x < 0.33 - gap && subPos.y > gap && subPos.y < 1.0 - gap) {
                    color = vec3(texel.r, 0.0, 0.0);
                    // Boost brightness slightly to compensate for black gaps
                    color *= 1.5; 
                }
            } else if (subPos.x < 0.66) {
                // Green stripe
                if (subPos.x < 0.66 - gap && subPos.y > gap && subPos.y < 1.0 - gap) {
                    color = vec3(0.0, texel.g, 0.0);
                    color *= 1.5;
                }
            } else {
                // Blue stripe
                if (subPos.x < 1.0 - gap && subPos.y > gap && subPos.y < 1.0 - gap) {
                    color = vec3(0.0, 0.0, texel.b);
                    color *= 1.5;
                }
            }
            
            // Mix original crisp pixel with sub-pixel effect based on pixelSize
            // If pixels are very small (<= 2), just show original to avoid aliasing mess
            float mixStrength = smoothstep(1.0, 4.0, pixelSize);
            
            gl_FragColor = vec4(mix(texel.rgb, color, mixStrength), opacity);
        }
    `
};