#define EDGE .2
precision mediump float;
varying vec2 vTextureCoord;
uniform float iTime;

// 黑色鉴别遮罩函数
float getBlackMask(vec2 uv) {
    // 顶部黑色遮罩，占据8%的区域，从80%到0%透明度过渡
    float topMask = 0.8 * (1.0 - smoothstep(0.0, 0.08, uv.y));
    
    // 只返回顶部遮罩
    return topMask;
}

void main()
{
    vec2 uv=vTextureCoord.xy;
    float edge=EDGE*abs(sin(iTime/5.));// 动态调整渐变边缘
    
    // 左右渐变
    float leftEdge=smoothstep(0.,edge,uv.x);
    float rightEdge=smoothstep(1.-edge,1.,uv.x);
    
    vec4 color=vec4(0,0,0,1);
    
    // 合并渐变效果
    float mask1=(1.-leftEdge)*(1.-rightEdge);// 创建遮罩值
    float mask2=(leftEdge)*(rightEdge);
    
    float mask=mask1+mask2;
    
    // 应用黑色鉴别遮罩
    float blackMask = getBlackMask(uv);
    mask = max(mask, blackMask); // 合并原有遮罩和黑色鉴别遮罩
    
    // 将遮罩应用到纹理
    color*=mask;// 应用最终的渐变效果
    
    // 输出最终颜色
    gl_FragColor=color;
}