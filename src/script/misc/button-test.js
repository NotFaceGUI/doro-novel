// 测试用
import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs';
const { Application, Container, Assets, NineSlicePlane, Text, TextStyle, Sprite, Texture } = PIXI;

class Button extends Container {
    constructor(texture, width, height, text, leftTexture, onClick) {
        super();

        const left = 75, top = 6, right = 75, bottom = 6;

        // 九宫格边框
        this.nine = new NineSlicePlane(texture, left, top, right, bottom);
        this.nine.width = width;
        this.nine.height = height;
        this.addChild(this.nine);

        // 中间区域 mask (初始透明蓝)
        this.center = new Sprite(Texture.WHITE);
        this.center.width = width - 12;
        this.center.height = height - top - bottom;
        this.center.x = 6;
        this.center.y = top;
        this.center.tint = 0x00aeff;
        this.center.alpha = 1; // 初始透明
        this.addChild(this.center);

        // 中间区域 mask (初始透明蓝)
        this.centerColor = new Sprite(Texture.WHITE);
        this.centerColor.width = width - 12;
        this.centerColor.height = height - top - bottom;
        this.centerColor.x = 6;
        this.centerColor.y = top;
        this.centerColor.tint = 0x00aeff;
        this.centerColor.alpha = 0; // 初始透明
        this.addChild(this.centerColor);


        const decorHeight = 150; // 基准高度，固定

        // 左侧装饰花纹
        this.leftDecor = new Sprite(leftTexture);
        // 设置左侧花纹高度 = center 高度，垂直居中
        this.leftDecor.height = decorHeight;
        this.leftDecor.scale.x = this.leftDecor.scale.y; // 保持纵横比
        this.leftDecor.y = this.center.y + (this.center.height - decorHeight) / 2; // 与 center 对齐
        this.leftDecor.x = 6; // 靠左
        this.addChild(this.leftDecor);

        this.rightDecor = new Sprite(leftTexture);
        this.rightDecor.height = decorHeight;
        this.rightDecor.scale.x = this.rightDecor.scale.y; // 保持纵横比
        this.rightDecor.y =  this.center.y + (this.center.height - decorHeight) / 2;
        this.rightDecor.x = this.width-6; // 靠右
        this.addChild(this.rightDecor);
        this.rightDecor.mask = this.center; // 右侧花纹使用同一个 mask

        // 保持纵横比并水平翻转
        this.rightDecor.scale.x = -Math.abs(this.rightDecor.scale.y);
        this.rightDecor.scale.y = Math.abs(this.rightDecor.scale.y);


        // 使用 center 作为 mask
        this.leftDecor.mask = this.center;

        // 文本
        const style = new TextStyle({
            fill: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
            resolution: window.devicePixelRatio
        });
        this.label = new Text(text, style);
        this.label.anchor.set(0.5);
        this.label.x = width / 2;
        this.label.y = height / 2;
        this.addChild(this.label);

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.selected = false;

        // 鼠标事件
        this.on('pointerdown', () => {
            console.log("object");
            this.selected = true;
            this.centerColor.alpha = 1;  // mask 变不透明蓝
            this.centerColor.tint = 0x21336F;
        });
        this.on('pointerup', () => {
            if (typeof onClick === 'function') onClick();
        });
        this.on('pointerupoutside', () => { });
        this.on('pointerover', () => {
        });
        this.on('pointerout', () => {
        });
    }

    deselect () {
        this.selected = false;
        this.center.alpha = 0;
    }
}

// ---------------------
// 创建 PIXI 应用
// ---------------------
const app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x253C78,
    resolution: window.devicePixelRatio,
    autoDensity: true
});
document.body.appendChild(app.view);

// ---------------------
// 加载纹理
// ---------------------
Promise.all([
    Assets.load('./slice.png'),   // 九宫格
    Assets.load('./left.png')     // 左侧花纹
]).then(([nineTexture, leftTexture]) => {

    const button = new Button(nineTexture, 500, 96, '开始游戏', leftTexture, () => {
        console.log('clicked!');
    });

    button.pivot.set(button.width / 2, button.height / 2);
    button.x = app.screen.width / 2;
    button.y = app.screen.height / 2;

    app.stage.addChild(button);
});

// ---------------------
// 窗口自适应
// ---------------------
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});