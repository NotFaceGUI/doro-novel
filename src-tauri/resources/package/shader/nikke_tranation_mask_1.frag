precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float iTime;
uniform vec2 iResolution;
// 大小
const float divisions = 28.0;

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;

    // 修正坐标（将原点从左下角换成左上角）
    vec2 corrected_coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
    float biggest_dim = max(iResolution.x, iResolution.y);
    vec2 st = corrected_coord / biggest_dim;

    // 计算动画变量 t
    float t = fract(iTime) * 3.0 - 1.0;

    // 网格分割
    vec2 f_st = fract(st * divisions);
    vec2 i_st = floor(st * divisions);
    f_st -= 0.5;

    // 将 t 与网格单元位置结合
    t = (1.0 - t + (i_st.x / divisions) - (1.0 - i_st.y / divisions));

    // 计算遮罩
    float a = step(t, 1.0 - abs(f_st.x + f_st.y)) * step(t, 1.0 - abs(f_st.x - f_st.y));

    // 从原始纹理中采样颜色，并按遮罩调节透明度
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = texColor * (1.0 - a);
}