/**
 * 文本标签解析工具
 * 用于处理文本中的特殊标签，如 <shake:参数/>, <color:red/> 等
 */

// 标签信息接口
export interface TextTag {
    name: string;           // 标签名称，如 "shake", "color"
    attributes: string;     // 标签属性，如 "参数", "red"
    startIndex: number;     // 标签在原文本中的开始位置
    endIndex: number;       // 标签在原文本中的结束位置
    length: number;         // 标签的总长度
}

// 解析结果接口
export interface ParseResult {
    cleanText: string;      // 移除标签后的纯文本
    tags: TextTag[];        // 解析出的所有标签
    originalText: string;   // 原始文本
}

/**
 * 文本标签解析器类
 */
export class TextTagParser {
    // 标签正则表达式：匹配 <name:attributes/> 格式
    private static readonly TAG_REGEX = /<([a-zA-Z_][a-zA-Z0-9_]*):([^>]*?)\/>/g;

    /**
     * 解析文本中的标签
     * @param text 要解析的文本
     * @returns 解析结果
     */
    public static parse(text: string): ParseResult {
        const tags: TextTag[] = [];
        let cleanText = text;
        let match: RegExpExecArray | null;

        // 重置正则表达式的lastIndex
        this.TAG_REGEX.lastIndex = 0;

        // 查找所有匹配的标签
        while ((match = this.TAG_REGEX.exec(text)) !== null) {
            const [fullMatch, name, attributes] = match;
            const startIndex = match.index;
            const endIndex = startIndex + fullMatch.length;

            tags.push({
                name: name.trim(),
                attributes: attributes.trim(),
                startIndex,
                endIndex,
                length: fullMatch.length
            });
        }

        // 按照位置倒序排列，这样从后往前删除不会影响前面的索引
        tags.sort((a, b) => b.startIndex - a.startIndex);

        // 从文本中移除所有标签
        for (const tag of tags) {
            cleanText = cleanText.substring(0, tag.startIndex) + cleanText.substring(tag.endIndex);
        }

        // 重新按照原始位置正序排列
        tags.sort((a, b) => a.startIndex - b.startIndex);

        // 调整标签位置，因为移除了前面的标签会影响后面标签的位置
        let offset = 0;
        for (const tag of tags) {
            tag.startIndex -= offset;
            tag.endIndex -= offset;
            offset += tag.length;
        }

        return {
            cleanText,
            tags,
            originalText: text
        };
    }

    /**
     * 根据标签名称过滤标签
     * @param tags 标签数组
     * @param tagName 要过滤的标签名称
     * @returns 过滤后的标签数组
     */
    public static filterTagsByName(tags: TextTag[], tagName: string): TextTag[] {
        return tags.filter(tag => tag.name === tagName);
    }

    /**
     * 检查文本是否包含指定标签
     * @param text 要检查的文本
     * @param tagName 标签名称
     * @returns 是否包含指定标签
     */
    public static hasTag(text: string, tagName: string): boolean {
        const result = this.parse(text);
        return result.tags.some(tag => tag.name === tagName);
    }

    /**
     * 获取指定标签的属性值
     * @param text 要解析的文本
     * @param tagName 标签名称
     * @returns 标签属性值数组
     */
    public static getTagAttributes(text: string, tagName: string): string[] {
        const result = this.parse(text);
        return result.tags
            .filter(tag => tag.name === tagName)
            .map(tag => tag.attributes);
    }

    /**
     * 移除指定标签
     * @param text 原始文本
     * @param tagName 要移除的标签名称
     * @returns 移除指定标签后的文本
     */
    public static removeTag(text: string, tagName: string): string {
        const tagRegex = new RegExp(`<${tagName}:[^>]*?/>`, 'g');
        return text.replace(tagRegex, '');
    }

    /**
     * 验证标签格式是否正确
     * @param text 要验证的文本
     * @returns 验证结果，包含是否有效和错误信息
     */
    public static validate(text: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // 检查是否有未闭合的标签
        const openTags = text.match(/<[a-zA-Z_][a-zA-Z0-9_]*:[^>]*?(?!\/>)/g);
        if (openTags) {
            errors.push(`发现未闭合的标签: ${openTags.join(', ')}`);
        }

        // 检查是否有格式错误的标签
        const invalidTags = text.match(/<[^>]*?>/g);
        if (invalidTags) {
            const validTags = text.match(this.TAG_REGEX);
            const validTagStrings = validTags ? validTags.map(tag => tag) : [];
            
            for (const tag of invalidTags) {
                if (!validTagStrings.includes(tag)) {
                    errors.push(`格式错误的标签: ${tag}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 导出便捷函数
export const parseTextTags = TextTagParser.parse;
export const hasTextTag = TextTagParser.hasTag;
export const getTagAttributes = TextTagParser.getTagAttributes;
export const removeTextTag = TextTagParser.removeTag;
export const validateTextTags = TextTagParser.validate;