import { Viewport } from "pixi-viewport";
import * as PIXI from 'pixi.js';
import { GameMode } from "../../types/app";
import { useActionStore } from "../../stores/action-store";

export const initViewportAction = (viewport: Viewport) => {
    console.log("viewport pos:", viewport.position);

    // 配置滚动
    // viewport.drag({
    //     wheel: false,
    // }).wheel({
    //     smooth: 20,
    // }).clampZoom({
    //     minScale: 1,
    //     maxScale: 3,
    // })
    /* .clamp({
            'direction': "all",
            'underflow': 'center'
        }) */

    viewport.moveCenter(viewport.worldWidth / 2, viewport.worldHeight / 2)

    // 定义变量来判断 Shift 和 Ctrl 键是否按下
    let isShiftPressed = false;
    let isCtrlPressed = false;


    let blueLine: HTMLDivElement | undefined = undefined;

    // 监听 keydown 事件 限制摄像机移动
    window.addEventListener("keydown", (event) => {
        if (useActionStore().gameMode !== GameMode.SCENE) {
            return;
        }
        if (event.key === "Shift" && !isShiftPressed && !isCtrlPressed) {
            isShiftPressed = true;
            // 如果 Shift 被按下，移除现有的 drag 插件，设置仅水平拖动, 同时不准缩放
            viewport.plugins.remove("drag");
            viewport.plugins.remove("wheel");
            viewport.drag({ wheel: false, direction: "x" });

            let canvasElement = document.getElementById("canvas");
            if (canvasElement && !blueLine) {
                blueLine = document.createElement("div");
                blueLine.style.position = "absolute";
                blueLine.style.top = "50%";
                blueLine.style.left = "50%";
                blueLine.style.opacity = '0.5'
                blueLine.style.transform = "translate(-50%, -50%)";
                blueLine.style.width = "100%";
                blueLine.style.height = "2px";
                blueLine.style.backgroundColor = "blue";
                canvasElement.appendChild(blueLine);
            }
        }

        if (event.key === "Control" && !isCtrlPressed && !isShiftPressed) {
            
            isCtrlPressed = true;
            // 如果 Ctrl 被按下，移除现有的 drag 插件，设置仅垂直拖动, 同时不准缩放
            viewport.plugins.remove("drag");
            viewport.plugins.remove("wheel");
            viewport.drag({ wheel: false, direction: "y" });

            let canvasElement = document.getElementById("canvas");

            if (canvasElement && !blueLine) {
                blueLine = document.createElement("div");
                blueLine.style.position = "absolute";
                blueLine.style.top = "50%";
                blueLine.style.left = "50%";
                blueLine.style.opacity = '0.5'
                blueLine.style.transform = "translate(-50%, -50%)";
                blueLine.style.width = "2px";
                blueLine.style.height = "100%";
                blueLine.style.backgroundColor = "blue";
                canvasElement.appendChild(blueLine);
            }
        }
    });

    // 监听 keyup 事件
    window.addEventListener("keyup", (event) => {
        if (useActionStore().gameMode !== GameMode.SCENE) {
            return;
        }
        if (event.key === "Shift") {
            isShiftPressed = false;
            // 松开 Shift 键时，恢复为自由拖动
            viewport.plugins.remove("drag");
            viewport.drag({ wheel: false, direction: "all" }).wheel({ smooth: 20, });
            if (blueLine) {
                blueLine.remove();
                blueLine = undefined;
            }
        }
        if (event.key === "Control") {
            isCtrlPressed = false;
            // 松开 Ctrl 键时，恢复为自由拖动
            viewport.plugins.remove("drag");
            viewport.drag({ wheel: false, direction: "all" }).wheel({ smooth: 20, });
            if (blueLine) {
                blueLine.remove();
                blueLine = undefined;
            }
        }

    });



    // 绘制边框
    border(viewport, 10, new PIXI.Color({ r: 255, g: 0, b: 0, a: 0.5 }))


}

let line: any;

export const border = (viewport: Viewport, borderWidth: number = 10, color: PIXI.Color) => {
    if (line) {
        viewport.removeChild(line)
    }
    line = viewport.addChild(new PIXI.Graphics())
    line.lineStyle(borderWidth, color).drawRect(0, 0, viewport.worldWidth, viewport.worldHeight)
}