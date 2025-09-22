
import { Application, Container, Filter, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { loadShader } from './tmep-loader';
import { DialogTextData, DialogueType } from '../../types/app';
import { textWriterSound } from './default-load';
import { Sound } from '@pixi/sound';

import { DropShadowFilter } from 'pixi-filters';
import { i18n } from "../../locales/i18n"
import CanvasManager from './canvas-manager';
import { CameraStandType, EasingFunction, setCameraByType } from '../camera-stand';
import { DEFAULT_RESOLUTION } from '../var';
import { Modification, PropertyPath } from '../common/snapshot';
import { TextTagParser } from '../util/text-parser';
import { executeTextTag, TagExecutionContext } from '../util/text-tag-handler';

const t = i18n.global.t

export class UIRender {
    public stage: Container;
    public app: Application;

    public normalDialog: Sprite = new Sprite;

    public normalTextAera: Container = new Container(); // 聊天对话的文本区域
    public voiceoverTextAera: Container = new Container(); // 旁白或心离活动的文本区域

    public currentDisplayText: { title: Text, content: Text }
    public currentSideText: { title: Text, content: Text }
    public titleCharacterColorLeftBar: Graphics;

    // 是否开始文本播放
    private isStart: boolean = false;
    private isTextAni: boolean = false;

    private textWriter: Sound | undefined = undefined;



    constructor(ui: Container, app: Application) {
        this.stage = ui;
        this.app = app;

        // 初始化Default文本
        const graphics = new Graphics();
        graphics.beginFill(0xff0000, 0);
        graphics.drawRect(0, app.view.height - 280, app.view.width, 280);
        graphics.endFill();


        // 初始化名字旁边的颜色bar 默认为红色
        this.titleCharacterColorLeftBar = new Graphics();
        this.titleCharacterColorLeftBar.beginFill(0xff0000)
        this.titleCharacterColorLeftBar.drawRect(35, app.view.height - 500, 6, 22);
        this.titleCharacterColorLeftBar.endFill();

        // 创建文本样式
        // 基于屏幕尺寸的响应式设计
        const baseWidth = 1920; // 设计基准宽度
        const scaleFactor = app.screen.width / baseWidth;

        const contentStyle = new TextStyle({
            fill: '#DDDDDD',
            fontSize: Math.max(16, 40 * scaleFactor), // 最小字体16px
            lineHeight: 45 * scaleFactor,
            fontFamily: 'Noto Sans SC',
            fontWeight: '600',
            breakWords: true,
            wordWrap: true,
            wordWrapWidth: app.screen.width - (140 * scaleFactor),
        });

        const titleStyle = new TextStyle({
            fill: '#ffffff',
            fontSize: Math.max(16, 40 * scaleFactor), // 最小字体16px
            lineHeight: 45 * scaleFactor,
            fontFamily: 'sourcehansans',
            fontWeight: 'bold',
            wordWrapWidth: app.screen.width,
        });

        // 创建文本
        const titleText = new Text("阿妮斯", titleStyle);
        const chatText = new Text("下次作战我就不参加了。", contentStyle);

        // 响应式定位
        titleText.x = 80 * scaleFactor;
        titleText.y = app.screen.height - (500 * scaleFactor);
        chatText.x = 80 * scaleFactor;
        chatText.y = app.screen.height - (430 * scaleFactor);

        this.currentDisplayText = {
            title: titleText,
            content: chatText,
        }

        // 创建文本样式
        const contentSideStyle = new TextStyle({
            fill: '#DDDDDD',
            fontSize: 25 * DEFAULT_RESOLUTION,
            lineHeight: 55 * scaleFactor,
            fontFamily: 'Noto Sans SC', // 使用 Noto Sans SC 字体
            fontWeight: '600', // 确保字体加粗
            breakWords: true,
            wordWrap: true,       // 自动换行
            align: 'center',
            // textBaseline: 'middle',
            wordWrapWidth: app.view.width - 650, // 让文字不会超出背景
        });


        this.currentSideText = {
            title: new Text("旁白", titleStyle),
            content: new Text("下次作战我就不参加了。", contentSideStyle),
        }

        // 添加到 normalTextAera
        this.normalTextAera.addChild(graphics);
        this.normalTextAera.addChild(this.titleCharacterColorLeftBar);
        this.normalTextAera.addChild(this.currentDisplayText.content);
        this.normalTextAera.addChild(this.currentDisplayText.title);

        this.voiceoverTextAera.addChild(this.currentSideText.content);

        // 设置成不可见
        this.normalTextAera.visible = false;
        this.voiceoverTextAera.visible = false;

        // 添加进ui图层
        this.stage.addChild(this.voiceoverTextAera);
        this.stage.addChild(this.normalTextAera);

        // 初始化旁边对话框

        const side = this.initSideDialogTemplate();

        // 设置文字锚点为中心
        this.currentSideText.content.anchor.set(0.5);
        this.voiceoverTextAera.addChild(side);

        // 获取 side 中心点的世界坐标
        console.log("aaaa", side);

        // 放置到 side 的中心
        this.currentSideText.content.x = side.x + side.width / 2;
        this.currentSideText.content.y = side.y + side.height / 2 - 5;

        this.currentSideText.content.zIndex = 10;
        this.voiceoverTextAera.sortChildren();


        this.initNikkeUITemplate().then((res) => {
            this.normalDialog = res;
            this.stage.addChild(this.normalDialog)

            this.normalDialog.visible = false;

            this.stage.sortableChildren = true;
            this.normalDialog.zIndex = 1;
            this.normalTextAera.zIndex = 10;
            this.voiceoverTextAera.zIndex = 10;

            this.stage.sortChildren();

            // 暂时先不要这样
            // this.startDialogue( [{
            //     speakerColor: 0xffffff,
            //     speaker: 'NPC',
            //     texts: [
            //         { text: "你今天过得怎么样？" },
            //         { text: "这个地方看起来很奇怪，我不确定我们是不是走错了路。" },
            //         { text: "你听说过那个传闻吗？我觉得我们应该调查一下。" },
            //         { text: "我想知道下一步该做什么，你有什么建议吗？" },
            //         { text: "这段旅程似乎不太顺利，真的很让人烦恼。" },
            //         { text: "如果我们再不赶紧行动，可能就来不及了。" },
            //         { text: "这里的一切都让我感到很不安,\n但我依然决定继续前行。" },
            //         { text: "我们能否依靠团队合作来度过目前的困难？" },
            //         { text: "我相信我们的选择一定是正确的，尽管现在看起来不太明朗。" },
            //         { text: "你能不能告诉我更多关于这个地方的事情？" }
            //     ],
            //     mode: DialogueType.NORMAL,
            // }, {
            //     speakerColor: 0xff00ff,
            //     speaker: '你好',
            //     texts: [{ text: "测试2" }],
            //     mode: DialogueType.NORMAL,
            // }], true)
        })

        // 加载特定音效
        textWriterSound().then((res) => {
            this.textWriter = res;
        });
    }

    /**
       * 初始化 Nikke UI 模板，在画布底部绘制一个透明黑色矩形
       */
    public async initNikkeUITemplate(): Promise<Sprite> {
        const frag = await loadShader('resources/package/shader/nikke_rect.frag');

        console.log("cesFrag", frag);

        // 创建一个空的 Texture 并转换为 Sprite
        const width = this.app.view.width;
        const height = this.app.view.height;

        const texture = Texture.WHITE;
        const normalRect = new Sprite(texture);

        normalRect.anchor.set(0.5)
        // 创建 filter，并传递 uniform 变量
        const filter = new Filter(undefined, frag, {
            iResolution: [width, height],
            uAlpha: 1.0,  // 初始不透明
        });

        normalRect.width = width;
        normalRect.height = height;
        normalRect.y = height / 2;
        normalRect.x = width / 2;

        // 应用 Shader 作为 Filter
        normalRect.filters = [filter];

        // this.stage.addChild(normalRect);

        return normalRect;
    }

    /**
    * 初始化 Nikke UI 侧边模板：黑色半透明背景 + 黑色描边 + 阴影
    */
    public initSideDialogTemplate(): Graphics {
        const width = this.app.view.width - 800;   // 可以根据需要设置宽度
        const height = 175 * DEFAULT_RESOLUTION;
        const x = 400;
        const y = this.app.view.height - height - 65 * DEFAULT_RESOLUTION;

        // 创建一个 Graphics 对象
        const sideRect = new Graphics();
        sideRect.pivot.set(0.5)

        // 设置阴影参数（注意：Pixi v7+ 支持 dropShadowFilter 更好看）
        const shadow = new DropShadowFilter({
            alpha: 0.4,
            blur: 4,
            distance: 4,
            color: 0x000000
        });
        sideRect.filters = [shadow];

        // 绘制带描边的半透明黑色矩形
        sideRect.lineStyle(2, 0x000000, 1); // 黑色描边，2px
        sideRect.beginFill(0x000000, 0.6);  // 半透明黑色填充


        sideRect.drawRect(0, 0, width, height); // 不要用 x, y 了
        sideRect.endFill();

        // 设置位置（真正移动的是容器）
        sideRect.position.set(x, y);

        return sideRect;
    }


    /**
     * 统一管理 UI 组件的显隐状态，添加透明度渐变效果
     */
    private currentDialogueMode: DialogueType | null = null; // 添加当前状态跟踪

    /**
     * 统一管理 UI 组件的显隐状态，添加透明度渐变效果
     */
    private updateVisibility(mode: DialogueType) {
        // 如果状态没有变化，直接返回
        if (this.currentDialogueMode === mode) {
            return;
        }


        console.log("对话模式变化：", this.currentDialogueMode, "→", mode);

        // 暂时这样处理
        if (mode === DialogueType.COMMANDER && this.currentDialogueMode === DialogueType.NORMAL) {
            mode = DialogueType.NORMAL;
            this.currentDialogueMode = mode;
            return
        }

        // 更新当前状态
        this.currentDialogueMode = mode;

        const uiMap: Record<DialogueType, (Sprite | Container)[]> = {
            [DialogueType.NORMAL]: [this.normalDialog, this.normalTextAera],
            [DialogueType.VOICEOVER]: [this.voiceoverTextAera],
            [DialogueType.COMMANDER]: [this.normalDialog, this.normalTextAera]
        };

        // 获取所有UI元素
        const allUIs: (Sprite | Container)[] = Object.values(uiMap).flat();

        // 需要显示的UI元素
        const showUIs: (Sprite | Container)[] = uiMap[mode] || [];
        console.log("需要显示的UI元素：", mode, showUIs.map(ui => ui.name));

        // 需要隐藏的UI元素
        const hideUIs = allUIs.filter(ui => !showUIs.includes(ui));
        console.log("需要隐藏的UI元素：", hideUIs);

        // 只对当前不可见但需要显示的UI元素进行初始化
        showUIs.forEach(ui => {
            // 检查元素是否已经可见，如果已经可见则跳过初始化
            if (ui.visible) return;

            if (ui === this.normalDialog && ui.filters && ui.filters[0]) {
                // 对于使用shader的normalDialog，暂时不设置visible，在动画开始时设置
                ui.filters[0].uniforms.uAlpha = 0;
            } else {
                // 对于普通容器，立即设置可见但透明
                ui.visible = true;
                ui.alpha = 0;
            }
        });

        // 隐藏元素的渐变效果
        hideUIs.forEach(ui => {
            if (!ui.visible) return;
            console.log("需要隐藏的UI元素()：", ui);
            if (ui === this.normalDialog && ui.filters && ui.filters[0]) {
                // 对于使用shader的normalDialog
                const startTime = Date.now();
                const duration = 300; // 300ms动画时长
                const startAlpha = ui.filters[0].uniforms.uAlpha;

                const fadeOut = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeOutCubic缓动函数
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentAlpha = startAlpha * (1 - easedProgress);

                    ui.filters![0].uniforms.uAlpha = currentAlpha;

                    if (progress >= 1) {
                        ui.visible = false;
                        ui.filters![0].uniforms.uAlpha = 0;
                        this.app.ticker.remove(fadeOut);
                    }
                };
                this.app.ticker.add(fadeOut);
            } else {
                // 对于普通容器（包括旁白边框）
                const startTime = Date.now();
                const duration = 300;
                const startAlpha = ui.alpha;

                const fadeOut = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeOutCubic缓动函数
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentAlpha = startAlpha * (1 - easedProgress);

                    ui.alpha = currentAlpha;

                    // 如果是旁白容器，同时处理其子元素的阴影效果
                    if (ui === this.voiceoverTextAera) {
                        ui.children.forEach(child => {
                            if (child.filters && child.filters[0] instanceof DropShadowFilter) {
                                (child.filters[0] as DropShadowFilter).alpha = 0.4 * currentAlpha;
                            }
                        });
                    }

                    if (progress >= 1) {
                        ui.visible = false;
                        ui.alpha = 0;
                        this.app.ticker.remove(fadeOut);
                    }
                };
                this.app.ticker.add(fadeOut);
            }
        });

        // 显示元素的渐变效果
        showUIs.forEach(ui => {
            // 检查元素是否已经完全可见，如果已经完全可见则跳过动画
            const isFullyVisible = ui.visible && (
                (ui === this.normalDialog && ui.filters && ui.filters[0] && ui.filters[0].uniforms.uAlpha >= 1) ||
                (ui !== this.normalDialog && ui.alpha >= 1)
            );

            if (isFullyVisible) return;

            // 为每个UI元素创建独立的动画参数
            const animationData = {
                startTime: Date.now(),
                duration: 400,
                targetAlpha: 1
            };

            if (ui === this.normalDialog && ui.filters && ui.filters[0]) {
                // 对于使用shader的normalDialog，在动画开始时设置可见
                ui.visible = true;

                const fadeIn = () => {
                    const elapsed = Date.now() - animationData.startTime;
                    const progress = Math.min(elapsed / animationData.duration, 1);

                    const easedProgress = 1 - Math.pow(1 - progress, 4);
                    const currentAlpha = animationData.targetAlpha * easedProgress;

                    ui.filters![0].uniforms.uAlpha = currentAlpha;

                    if (progress >= 1) {
                        ui.filters![0].uniforms.uAlpha = 1;
                        this.app.ticker.remove(fadeIn);
                    }
                };
                this.app.ticker.add(fadeIn);
            } else {
                // 对于普通容器（包括旁白边框）
                const fadeIn = () => {
                    const elapsed = Date.now() - animationData.startTime;
                    const progress = Math.min(elapsed / animationData.duration, 1);

                    // 使用easeOutQuart缓动函数
                    const easedProgress = 1 - Math.pow(1 - progress, 4);
                    const currentAlpha = animationData.targetAlpha * easedProgress;

                    ui.alpha = currentAlpha;

                    // 如果是旁白容器，同时处理其子元素的阴影效果
                    if (ui === this.voiceoverTextAera) {
                        ui.children.forEach(child => {
                            if (child.filters && child.filters[0] instanceof DropShadowFilter) {
                                (child.filters[0] as DropShadowFilter).alpha = 0.4 * currentAlpha;
                            }
                        });
                    }

                    if (progress >= 1) {
                        ui.alpha = 1;
                        this.app.ticker.remove(fadeIn);
                    }
                };
                this.app.ticker.add(fadeIn);
            }
        });
    }

    /**
     * 开始处理文本
     * @param messages 对话数据
     * @param isEndVisible 当对话处理完毕时需不需要隐藏对话: 默认不隐藏
     * @param hideDelay 隐藏延迟时间(秒): 默认0秒
     */
    public async startDialogue(messages: DialogTextData[], modification: Map<PropertyPath, Modification>, isEndVisible: boolean = false, hideDelay: number = 0) {
        this.isStart = true; // 开始处理文本

        if (messages.length > 0) {
            if (messages[0].mode === DialogueType.NORMAL || messages[0].mode === DialogueType.COMMANDER) {
                this.normalDialog.visible = true;
                this.normalTextAera.visible = true;
            } else if (messages[0].mode === DialogueType.VOICEOVER) {
                this.voiceoverTextAera.visible = true;
            }
        }

        await this.playDialogue(messages, modification);



        if (isEndVisible) {
            if (hideDelay > 0) {
                // 延迟隐藏UI
                setTimeout(() => {
                    this.voiceoverTextAera.visible = false;
                    this.normalDialog.visible = false;
                    this.normalTextAera.visible = false;
                    this.isStart = false; // 结束
                }, hideDelay); // 转换为毫秒
            } else {
                // 立即隐藏UI
                this.voiceoverTextAera.visible = false;
                this.normalDialog.visible = false;
                this.normalTextAera.visible = false;
                this.isStart = false; // 结束
            }
        }
    }

    private resolveClick?: () => void; // 解决点击等待的 Promise

    /**
    * 播放对话，每次等待用户点击继续
    */
    private async playDialogue(messages: DialogTextData[], modification: Map<PropertyPath, Modification>) {
        console.log("对话开始:", messages);
        for (const message of messages) {
            // 遍历 message.text 数组中的每一项
            const currentMode = message.mode;
            for (const line of message.texts) {
                // 显示文本行
                await this.displayMessage({
                    speakerColor: message.speakerColor,
                    speaker: message.speaker,
                    texts: [{
                        text: line.text,
                        isCameraProxy: line.isCameraProxy,
                        cameraParms: line.cameraParms
                    }],  // 将当前行包装成一个数组传递
                    mode: currentMode,
                    isBind: message.isBind,
                    parms: message.parms,
                }, modification);

                // 等待用户点击，显示下一行
                await this.waitForClick();
            }
        }
        console.log("对话结束");
    }



    private lastPlayTime = 0;
    private lastAnimationName = "idle";

    private async displayMessage(message: DialogTextData, modification: Map<PropertyPath, Modification>) {
        console.log("日志：", message)
        // 设置摄像机位置
        if (message.parms) {
            // 这里可以添加摄像机移动逻辑
            console.log("摄像机移动到：", message.parms.CharacterName);

            const canvas = CanvasManager.getInstance();

            // 只有当开启摄像机代理的时候才会取操控摄像机这样不会和代理进行争抢
            if (message.texts[0].isCameraProxy) {
                setCameraByType(message.parms.cameraStandType as CameraStandType, {
                    modification: modification,
                    characterName: message.parms.CharacterName,
                    camera: canvas.viewport,
                    enableAnimation: message.parms.isMove,
                    ease: message.parms.ease as EasingFunction,
                    duration: message.parms.duration || 300,
                    centerX: message.parms.spine?.x || 0,
                    spine: message.parms.spine,
                    xOffSet: message.parms.xOffSet,
                    yOffSet: message.parms.yOffSet,
                })
            }


            if (message.parms.animation) {
                // 如果有动画，播放指定的动画
                const spine = message.parms.spine;
                if (spine && spine.state) {
                    const animationName = message.parms.animation;

                    // 检查动画是否存在
                    if (spine.state.data.skeletonData.findAnimation(animationName)) {
                        // 获取当前正在播放的动画
                        const currentAnimation = (spine.state.tracks[0] as any).animation;
                        console.log("currentAnimation", currentAnimation)

                        // 如果当前没有播放动画或者播放的动画与要播放的动画不同，才设置新动画
                        if (!currentAnimation || currentAnimation.name !== animationName) {
                            if (message.parms.isLoop) {
                                this.lastAnimationName = animationName;
                                spine.state.setAnimation(0, animationName, true); // 0表示轨道索引，true表示循环播放
                            } else {
                                spine.state.setAnimation(0, animationName, false);

                                const talkStartDuration = spine.state.data.skeletonData.findAnimation(animationName)?.duration || 1;

                                // 当动画播放完成时，切换回上一个动画
                                setTimeout(() => {
                                    spine.state.setAnimation(0, this.lastAnimationName, true);
                                }, talkStartDuration * 1000);
                            }
                            console.log(`为角色 ${message.parms.CharacterName} 播放动画: ${animationName}`);
                        } else {
                            console.log(`角色 ${message.parms.CharacterName} 已经在播放动画: ${animationName}，跳过重复播放`);
                        }
                    } else {
                        console.warn(`角色 ${message.parms.CharacterName} 没有可用的动画: ${animationName}`);
                    }
                }
            }

            // 在normal模式时添加talk动画序列
            if (message.mode === DialogueType.NORMAL && message.parms.spine) {
                const spine = message.parms.spine;

                // 检查是否有talk_start和talk_end动画
                const hasTalkStart = spine.state.hasAnimation('talk_start');
                const hasTalkEnd = spine.state.hasAnimation('talk_end');

                if (hasTalkStart) {
                    // 播放talk_start动画，循环
                    spine.state.addAnimation(1, 'talk_start', true, 0);

                    // 如果有talk_end，在talk_start完成后播放talk_end
                    if (hasTalkEnd) {
                        // 获取talk_start动画的持续时间
                        const talkStartDuration = spine.state.data.skeletonData.findAnimation('talk_start')?.duration || 1;

                        // 延迟播放talk_end，让它在文字显示完成前播放
                        setTimeout(() => {
                            if (this.isTextAni) {
                                // 如果文字还在显示，继续循环播放talk_start
                                spine.state.addAnimation(1, 'talk_start', true, 0);
                            }
                        }, talkStartDuration * 1000);
                    }

                    console.log(`为角色 ${message.parms.CharacterName} 开始播放talk动画序列`);
                } else {
                    console.warn(`角色 ${message.parms.CharacterName} 没有可用的talk_start动画`);
                }
            }

            // 如果可以移动
            if (message.parms.isMove) {


                // console.log("当前角色的位置：", message.parms.spine?.x, message.parms.spine?.y! - (message.parms.spine?.height! / 2));
                // console.log(message.parms.spine);
                // canvas.viewport.moveCenter(message.parms.spine?.x || 0, message.parms.spine?.y! - (message.parms.spine?.height! - 200));
                // canvas.viewport.emit('moved')
                // canvas.viewport.emit('zoomed');

                // const slot = message.parms.spine?.skeleton.findSlot('face');
                // console.log(slot);
                // // @ts-ignore
                // const attachment = slot?.attachment;

                // if (attachment) {
                //     const pos = new Point();

                //     // 1. 计算在骨骼空间的世界坐标

                //     attachment.computeWorldPosition(slot?.bone, pos);

                //     console.log("当前角色的位置：", message.parms.spine?.x! - pos.x, message.parms.spine?.y! - pos.y);


                //     message.parms.spine?.toLocal(pos, canvas.viewport, pos);
                //     console.log('PointAttachment "face" 的 PIXI 世界坐标为:', pos);
                // }
            }
        }

        this.updateVisibility(message.mode);
        let tempText: {
            title: Text;
            content: Text;
        } = this.currentDisplayText;

        switch (message.mode) {
            case DialogueType.NORMAL:
                tempText = this.currentDisplayText
                break;
            case DialogueType.VOICEOVER:
                tempText = this.currentSideText
                break;
            case DialogueType.COMMANDER:
                tempText = this.currentDisplayText
                break;
            default:
                tempText = this.currentDisplayText
                break;
        }

        // 基于屏幕尺寸的响应式设计
        const baseWidth = 1920; // 设计基准宽度
        const scaleFactor = this.app.screen.width / baseWidth;

        this.titleCharacterColorLeftBar.clear();
        this.titleCharacterColorLeftBar.beginFill(message.speakerColor);
        this.titleCharacterColorLeftBar.drawRect(45 * scaleFactor, this.app.screen.height - (500 * scaleFactor) + 5, 10, 40 * scaleFactor);
        this.titleCharacterColorLeftBar.endFill();

        tempText.title.text = t(message.speaker);
        tempText.content.text = '';

        let fullText = message.texts[0].text;
        const parseResult = TextTagParser.parse(fullText);
        fullText = parseResult.cleanText;

        console.log("解析出的标签：", parseResult.tags);

        let currentText = '';

        const baseDelay = 45;
        const lengthFactor = 0.5;
        const delayPerCharacter = Math.max(baseDelay - fullText.length * lengthFactor, 15);
        const minSoundInterval = Math.max(delayPerCharacter, 70);

        console.log("文字显示的总时长：", fullText.length * delayPerCharacter);

        this.isTextAni = true;

        for (let i = 0; i <= fullText.length; i++) {
            // 将i传递到tag数组中取匹配startIndex看看有没有在这个index执行的标签
            const tag = parseResult.tags.find(tag => tag.startIndex === i);
            if (tag) {
                // 创建标签执行上下文
                const context: TagExecutionContext = {
                    textElement: tempText.content,
                    currentText: currentText,
                    position: i,
                    fullText: fullText,
                    parseResult: parseResult
                };

                // 执行标签逻辑
                executeTextTag(tag, context);
                console.log(`在索引 ${i} 处执行标签 ${tag.name}，属性为 ${tag.attributes}`);
            }

            if (i === fullText.length) {
                // 文字是完成了但是不能播放
                break;
            }

            if (!this.isTextAni) {
                tempText.content.text = fullText;
                break;
            }



            const char = fullText[i];
            currentText += char;
            tempText.content.text = currentText;

            const now = Date.now();
            if (char !== ' ' && char.trim() !== '' && now - this.lastPlayTime >= minSoundInterval) {
                try {
                    const volume = this.getRandomVolume(0.4, 0.6);
                    this.textWriter?.play({ volume });
                    this.lastPlayTime = now;
                } catch (err) {
                    console.warn("播放音效失败", err);
                }
            }

            await this.delay(delayPerCharacter / 1000);
        }




        this.isTextAni = false;

        // 文字显示完成后，播放talk_end动画并回到idle状态
        if (message.mode === DialogueType.NORMAL && message.parms?.spine) {
            const spine = message.parms.spine;

            // 清除轨道1上的talk动画
            spine.state.setEmptyAnimation(1, 0.3); // 0.3秒的淡出时间

            console.log(`角色 ${message.parms.CharacterName} 的talk动画已停止`);
        }
    }


    private getRandomVolume(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    // 延迟函数，用于实现逐字显示
    private delay(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000)); // 转换为毫秒
    }

    /**
     * 等待用户点击
     */
    private waitForClick(): Promise<void> {
        return new Promise(resolve => {
            this.resolveClick = resolve; // 绑定 resolve，点击时触发
        });
    }

    /**
     * 监听用户点击
     */
    public onUserClick() {
        if (!this.isStart) return; // 播放没开始不处理用户点击

        // 如果是在文字动画进行中的点击，就关闭文字动画
        if (this.isTextAni) {
            this.isTextAni = false;
        }

        if (this.resolveClick) {
            this.resolveClick(); // 触发 Promise 继续播放
            this.resolveClick = undefined;
        }
    }

    /**
     * 添加精灵到舞台
     * @param texture 纹理对象
     * @param x X 坐标
     * @param y Y 坐标
     * @returns 返回创建的 Sprite
     */
    addSprite(texture: Texture, x = 0, y = 0): Sprite {
        const sprite = new Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        this.stage.addChild(sprite);
        return sprite;
    }

    /**
     * 添加文本到舞台
     * @param text 文本内容
     * @param x X 坐标
     * @param y Y 坐标
     * @param style 文本样式，包含 fontFamily 指定字体
     * @returns 返回创建的 Text 对象
     */
    addText(text: string, x = 50, y = 50, style?: Partial<TextStyle>): Text {
        const textStyle = new TextStyle({
            fill: '#ffffff',
            fontSize: 24,
            fontFamily: 'sourcehansans', // 使用 Noto Sans SC 字体
            fontWeight: 'bold', // 确保字体加粗
            ...style,
        });
        const textObj = new Text(text, textStyle);
        textObj.x = x;
        textObj.y = y;
        this.stage.addChild(textObj);
        return textObj;
    }

    /**
     * 绑定交互事件
     * @param target 目标对象（Sprite 或 Container）
     * @param event 事件类型，如 'pointerdown', 'pointerup', 'pointermove'
     * @param handler 事件处理函数
     */
    addInteraction<T extends Sprite | Container>(
        target: T,
        event: 'pointerdown' | 'pointerup' | 'pointermove' | 'pointerover' | 'pointerout',
        handler: (event: any) => void
    ): void {
        target.eventMode = 'static';
        target.on(event, handler);
    }

    /**
     * 移除对象
     * @param target 需要移除的对象（Sprite 或 Container）
     */
    removeObject(target: Sprite | Container): void {
        if (target.parent) {
            target.parent.removeChild(target);
        }
    }

    /**
     * 清空舞台
     */
    clearStage(): void {
        this.stage.removeChildren();
    }
}