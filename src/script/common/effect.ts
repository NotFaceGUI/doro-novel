import * as PIXI from 'pixi.js';

/**
 * 创建点阵半透滤镜 (Stipple Transparency)
 * @param transparency 初始透明度 (0~1)
 * @param dotSize 点阵大小 (像素) 默认 4
 */
export function createStippleTransparencyFilter(
    transparency: number = 0,
    dotSize: number = 4
) {
    const vertexShader = `
        attribute vec2 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat3 projectionMatrix;
        varying vec2 vTextureCoord;
        void main(void){
            vTextureCoord = aTextureCoord;
            gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        }
    `;

    const fragmentShader = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uTransparency;
        uniform float uDotSize;

        // 8x8 Bayer 阈值公式，无数组，兼容 WebGL1
        float bayerThreshold(vec2 pixel) {
            float x = mod(pixel.x, 16.0);
            float y = mod(pixel.y, 16.0);

            // 公式化 Bayer 8x8 阈值矩阵
            return (
                mod(x*4.0,16.0) + mod(y*4.0,16.0)
            ) / 64.0;
        }

        void main(void){
            vec4 color = texture2D(uSampler, vTextureCoord);

            // 当前像素坐标除以点阵大小
            vec2 pixel = gl_FragCoord.xy / uDotSize;

            float threshold = bayerThreshold(pixel);

            // 点阵半透浮现
            if(uTransparency < threshold) discard;

            gl_FragColor = color;
        }
    `;

    return new PIXI.Filter(vertexShader, fragmentShader, {
        uTransparency: transparency,
        uDotSize: dotSize,
    });
}

/**
 * 创建透明度滤镜 (Alpha Filter)
 * @param alpha 透明度 (0~1)
 */
export function createAlphaFilter(alpha: number = 1) {
    const vertexShader = `
        attribute vec2 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat3 projectionMatrix;
        varying vec2 vTextureCoord;
        void main(void){
            vTextureCoord = aTextureCoord;
            gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        }
    `;

    const fragmentShader = `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uAlpha;

        void main() {
            vec4 texColor = texture2D(uSampler, vTextureCoord);
            gl_FragColor = vec4(texColor.rgb * uAlpha, texColor.a * uAlpha);
        }
    `;

    return new PIXI.Filter(vertexShader, fragmentShader, {
        uAlpha: alpha,
    });
}