import { TransitionType, TransitionConfig, TransitionExecutor } from '../../types/transition';
import { Action } from 'pixijs-actions';
import CanvasManager from '../render/canvas-manager';
/**
 * 过渡管理器 - 负责执行各种过渡效果
 */
export class TransitionManager implements TransitionExecutor {
    private isTransitionRunning = false;
    private canvasManager: CanvasManager;

    constructor(canvasManager: CanvasManager) {
        this.canvasManager = canvasManager;
    }

    /**
     * 执行过渡效果
     */
    async execute(config: TransitionConfig): Promise<void> {
        if (this.isTransitionRunning) {
            this.stop();
        }

        this.isTransitionRunning = true;

        try {
            switch (config.type) {
                case TransitionType.FADE:
                    await this.executeFadeTransition(config);
                    break;
                case TransitionType.FADE_IN:
                    await this.executeFadeInTransition(config);
                    break;
                case TransitionType.FADE_OUT:
                    await this.executeFadeOutTransition(config);
                    break;
                default:
                    await this.executeFadeTransition(config);
            }
        } finally {
            this.isTransitionRunning = false;
        }
    }

    /**
     * 停止当前过渡
     */
    stop(): void {
        this.isTransitionRunning = false;
    }

    /**
     * 检查是否正在运行过渡
     */
    isRunning(): boolean {
        return this.isTransitionRunning;
    }

    // duration 单位：秒
    private createFadeTransition(duration: number, onMidpoint?: () => void) {
        const third = duration / 3;

        return Action.sequence([
            // 1. 淡入到黑
            Action.fadeIn(third).linear(),

            Action.waitForDuration(third),
            // 2. 中间执行切换
            Action.run(() => {
                if (onMidpoint) onMidpoint();
            }),

            // 3. 再淡出黑
            Action.fadeOut(third).linear(),
        ]);
    }


    /**
     * 淡入淡出过渡
     */
    private async executeFadeTransition(config: TransitionConfig): Promise<void> {
        return new Promise((resolve) => {
            // 使用
            const fadeTransition = this.createFadeTransition(config.duration / 1000, () => {
                console.log("🔄 切换场景！");
            });

            this.canvasManager.initMask.run(fadeTransition);

            setTimeout(() => {
                resolve();
            }, config.duration);
        });
    }

    /**
     * 淡入过渡
     */
    private async executeFadeInTransition(config: TransitionConfig): Promise<void> {
        return new Promise((resolve) => {
            console.log("开始淡入")
            const fadeInTransition = Action.fadeOut(config.duration / 1000).linear();

            // 使用独立的transitionMask，设置为最顶层
            this.canvasManager.transitionMask.zIndex = 9999;
            this.canvasManager.transitionMask.alpha = 1; // 确保开始时不透明
            this.canvasManager.uiRender.stage.sortChildren(); // 重新排序

            this.canvasManager.transitionMask.run(fadeInTransition);

            setTimeout(() => {
                resolve();
                console.log("淡入结束")
                // 淡入结束后将transitionMask移到文字下面
                this.canvasManager.transitionMask.zIndex = -1;
                this.canvasManager.uiRender.stage.sortChildren() // 重新排序
            }, Math.max(config.duration - 50, 0));
        });
    }

    /**
     * 淡出过渡
     */
    private async executeFadeOutTransition(config: TransitionConfig): Promise<void> {
        return new Promise((resolve) => {
            console.log("开始淡出")

            const fadeOutTransition = Action.fadeIn(config.duration / 1000).linear();

            // 使用独立的transitionMask，设置为最顶层
            this.canvasManager.transitionMask.zIndex = 9999;
            this.canvasManager.transitionMask.alpha = 0; // 确保开始时透明
            this.canvasManager.uiRender.stage.sortChildren(); // 重新排序

            this.canvasManager.transitionMask.run(fadeOutTransition);

            setTimeout(() => {
                resolve();

                console.log("淡出结束")
                // 淡出结束后将transitionMask移到文字下面
                this.canvasManager.transitionMask.zIndex = -1;
                this.canvasManager.uiRender.stage.sortChildren() // 重新排序
            }, config.duration);
        });
    }

}