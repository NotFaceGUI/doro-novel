precision mediump float;
varying vec2 vTextureCoord;
uniform float uAlpha;

void main() {
    float y = vTextureCoord.y;
    float alpha;

    // 第一段：y < 0.75 完全透明
    if (y < 0.75) {
        alpha = 0.0;
    }
    // 第二段：0.75 ~ 0.79 从透明到70%透明度（平滑过渡）
    else if (y < 0.8) {
        alpha = smoothstep(0.75, 0.8, y) * 0.7; // 0.0 → 0.7
    }
    // 第三段：0.79 ~ 1.0 从70%到90%透明度（平滑过渡）
    else {
        float t = smoothstep(0.8, 1.0, y);  // 平滑过渡
        alpha = mix(0.7, 0.95, t);  // 从 0.7 线性过渡到 0.9
    }

    // 应用uAlpha控制整体透明度
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * uAlpha);
}
