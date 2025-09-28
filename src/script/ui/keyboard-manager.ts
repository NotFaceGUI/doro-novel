/**
 * 键盘事件管理器
 * 用于处理全局键盘事件监听和按钮触发
 */
export class KeyboardManager {
    private static instance: KeyboardManager | null = null;
    private buttonRegistry: Map<number, () => void> = new Map();
    private isListening: boolean = false;

    private constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): KeyboardManager {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }

    /**
     * 注册按钮
     * @param orderNumber 按钮序号
     * @param callback 点击回调函数
     */
    public registerButton(orderNumber: number, callback: () => void): void {
        this.buttonRegistry.set(orderNumber, callback);
        this.startListening();
    }

    /**
     * 注销按钮
     * @param orderNumber 按钮序号
     */
    public unregisterButton(orderNumber: number): void {
        this.buttonRegistry.delete(orderNumber);
        
        // 如果没有注册的按钮了，停止监听
        if (this.buttonRegistry.size === 0) {
            this.stopListening();
        }
    }

    /**
     * 开始监听键盘事件
     */
    private startListening(): void {
        if (!this.isListening) {
            document.addEventListener('keydown', this.handleKeyDown);
            this.isListening = true;
        }
    }

    /**
     * 停止监听键盘事件
     */
    private stopListening(): void {
        if (this.isListening) {
            document.removeEventListener('keydown', this.handleKeyDown);
            this.isListening = false;
        }
    }

    /**
     * 处理键盘按下事件
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // 检查是否是数字键（1-9）
        const key = event.key;
        const orderNumber = parseInt(key);
        
        if (isNaN(orderNumber) || orderNumber < 1 || orderNumber > 9) {
            return;
        }

        // 检查是否有对应序号的按钮
        const callback = this.buttonRegistry.get(orderNumber);
        if (callback) {
            // 阻止默认行为
            event.preventDefault();
            event.stopPropagation();
            
            // 触发按钮点击
            callback();
        }
    }

    /**
     * 清理所有注册的按钮
     */
    public clear(): void {
        this.buttonRegistry.clear();
        this.stopListening();
    }

    /**
     * 获取当前注册的按钮数量
     */
    public getRegisteredButtonCount(): number {
        return this.buttonRegistry.size;
    }

    /**
     * 检查指定序号的按钮是否已注册
     */
    public isButtonRegistered(orderNumber: number): boolean {
        return this.buttonRegistry.has(orderNumber);
    }
}