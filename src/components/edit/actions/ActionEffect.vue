<template>
    <div class="action-item-main">
        <ActionItemHead content="✨ 特效" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content" v-show="!actionItem.isToggle">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                特效操作模式：
            </div>

            <Dropdown v-model="selectedOption" @update:modelValue="onSelectModel" :options="EffectOperaMode"
                :disabled="false" />

            <ActionBottomLine></ActionBottomLine>

            <template v-if="EffectOperaMode[selectedOption].value === 'add'">
                <div class="action-title">
                    特效类型：
                </div>
                <Dropdown style="width: 100%;" v-model="selectedEffectType" @update:modelValue="onSelectEffectType"
                    :options="EffectTypes" :disabled="false" />

                <!-- 模糊特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'blur'">
                    <div class="action-title">
                        模糊强度
                    </div>
                    <div>
                        <FilterSlider label="模糊" :min="0" :max="20" :step="0.1" :modelValue="blurValue"
                            @update:modelValue="handleBlurChange" />
                    </div>
                </template>

                <!-- 亮度特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'brightness'">
                    <div class="action-title">
                        亮度调节
                    </div>
                    <div>
                        <FilterSlider label="亮度" :min="0" :max="2" :step="0.01" :modelValue="brightnessValue"
                            @update:modelValue="handleBrightnessChange" />
                    </div>
                </template>

                <!-- 对比度特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'contrast'">
                    <div class="action-title">
                        对比度调节
                    </div>
                    <div>
                        <FilterSlider label="对比度" :min="0" :max="2" :step="0.01" :modelValue="contrastValue"
                            @update:modelValue="handleContrastChange" />
                    </div>
                </template>

                <!-- 饱和度特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'saturation'">
                    <div class="action-title">
                        饱和度调节
                    </div>
                    <div>
                        <FilterSlider label="饱和度" :min="0" :max="2" :step="0.01" :modelValue="saturationValue"
                            @update:modelValue="handleSaturationChange" />
                    </div>
                </template>

                <!-- 点阵半透特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'stipple'">
                    <div class="action-title">
                        透明度
                    </div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="stippleTransparency"
                            @update:modelValue="handleStippleTransparencyChange" />
                    </div>
                    <div class="action-title">
                        点阵大小
                    </div>
                    <div>
                        <FilterSlider label="点阵大小" :min="1" :max="10" :step="1" :modelValue="stippleDotSize"
                            @update:modelValue="handleStippleDotSizeChange" />
                    </div>
                </template>

                <!-- 发光特效参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'bloom'">
                    <div class="action-title">
                        模糊强度
                    </div>
                    <div>
                        <FilterSlider label="模糊" :min="0" :max="10" :step="0.1" :modelValue="bloomBlur"
                            @update:modelValue="handleBloomBlurChange" />
                    </div>
                    <div class="action-title">
                        模糊质量
                    </div>
                    <div>
                        <FilterSlider label="质量" :min="1" :max="10" :step="1" :modelValue="bloomQuality"
                            @update:modelValue="handleBloomQualityChange" />
                    </div>
                    <div class="action-title">
                        核心大小
                    </div>
                    <div>
                        <FilterSlider label="核心" :min="5" :max="15" :step="2" :modelValue="bloomKernelSize"
                            @update:modelValue="handleBloomKernelSizeChange" />
                    </div>
                </template>

                <!-- 色彩调整滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'adjustment'">
                    <div class="action-title">伽马值</div>
                    <div>
                        <FilterSlider label="伽马" :min="0.1" :max="3" :step="0.1" :modelValue="adjustmentGamma"
                            @update:modelValue="handleAdjustmentGammaChange" />
                    </div>
                    <div class="action-title">饱和度</div>
                    <div>
                        <FilterSlider label="饱和度" :min="0" :max="2" :step="0.01" :modelValue="adjustmentSaturation"
                            @update:modelValue="handleAdjustmentSaturationChange" />
                    </div>
                    <div class="action-title">对比度</div>
                    <div>
                        <FilterSlider label="对比度" :min="0" :max="2" :step="0.01" :modelValue="adjustmentContrast"
                            @update:modelValue="handleAdjustmentContrastChange" />
                    </div>
                    <div class="action-title">亮度</div>
                    <div>
                        <FilterSlider label="亮度" :min="0" :max="2" :step="0.01" :modelValue="adjustmentBrightness"
                            @update:modelValue="handleAdjustmentBrightnessChange" />
                    </div>
                    <div class="action-title">红色</div>
                    <div>
                        <FilterSlider label="红色" :min="0" :max="2" :step="0.01" :modelValue="adjustmentRed"
                            @update:modelValue="handleAdjustmentRedChange" />
                    </div>
                    <div class="action-title">绿色</div>
                    <div>
                        <FilterSlider label="绿色" :min="0" :max="2" :step="0.01" :modelValue="adjustmentGreen"
                            @update:modelValue="handleAdjustmentGreenChange" />
                    </div>
                    <div class="action-title">蓝色</div>
                    <div>
                        <FilterSlider label="蓝色" :min="0" :max="2" :step="0.01" :modelValue="adjustmentBlue"
                            @update:modelValue="handleAdjustmentBlueChange" />
                    </div>
                    <div class="action-title">透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="adjustmentAlpha"
                            @update:modelValue="handleAdjustmentAlphaChange" />
                    </div>
                </template>

                <!-- ASCII艺术滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'ascii'">
                    <div class="action-title">字符大小</div>
                    <div>
                        <FilterSlider label="大小" :min="4" :max="20" :step="1" :modelValue="asciiSize"
                            @update:modelValue="handleAsciiSizeChange" />
                    </div>
                </template>

                <!-- 斜面滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'bevel'">
                    <div class="action-title">旋转角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="360" :step="1" :modelValue="bevelRotation"
                            @update:modelValue="handleBevelRotationChange" />
                    </div>
                    <div class="action-title">厚度</div>
                    <div>
                        <FilterSlider label="厚度" :min="1" :max="10" :step="0.5" :modelValue="bevelThickness"
                            @update:modelValue="handleBevelThicknessChange" />
                    </div>
                    <div class="action-title">光源颜色</div>
                    <div><input type="color" :value="'#' + bevelLightColor.toString(16).padStart(6, '0')"
                            @input="handleBevelLightColorChange" /></div>
                    <div class="action-title">光源透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="bevelLightAlpha"
                            @update:modelValue="handleBevelLightAlphaChange" />
                    </div>
                    <div class="action-title">阴影颜色</div>
                    <div><input type="color" :value="'#' + bevelShadowColor.toString(16).padStart(6, '0')"
                            @input="handleBevelShadowColorChange" /></div>
                    <div class="action-title">阴影透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="bevelShadowAlpha"
                            @update:modelValue="handleBevelShadowAlphaChange" />
                    </div>
                </template>

                <!-- 凸起收缩滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'bulge-pinch'">
                    <div class="action-title">中心X</div>
                    <div>
                        <FilterSlider label="X" :min="0" :max="1" :step="0.01" :modelValue="bulgePinchCenterX"
                            @update:modelValue="handleBulgePinchCenterXChange" />
                    </div>
                    <div class="action-title">中心Y</div>
                    <div>
                        <FilterSlider label="Y" :min="0" :max="1" :step="0.01" :modelValue="bulgePinchCenterY"
                            @update:modelValue="handleBulgePinchCenterYChange" />
                    </div>
                    <div class="action-title">半径</div>
                    <div>
                        <FilterSlider label="半径" :min="0" :max="600" :step="10" :modelValue="bulgePinchRadius"
                            @update:modelValue="handleBulgePinchRadiusChange" />
                    </div>
                    <div class="action-title">强度</div>
                    <div>
                        <FilterSlider label="强度" :min="-1" :max="1" :step="0.01" :modelValue="bulgePinchStrength"
                            @update:modelValue="handleBulgePinchStrengthChange" />
                    </div>
                </template>

                <!-- 投影滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'drop-shadow'">
                    <div class="action-title">旋转角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="360" :step="1" :modelValue="dropShadowRotation"
                            @update:modelValue="handleDropShadowRotationChange" />
                    </div>
                    <div class="action-title">距离</div>
                    <div>
                        <FilterSlider label="距离" :min="0" :max="50" :step="1" :modelValue="dropShadowDistance"
                            @update:modelValue="handleDropShadowDistanceChange" />
                    </div>
                    <div class="action-title">颜色</div>
                    <div><input type="color" :value="'#' + dropShadowColor.toString(16).padStart(6, '0')"
                            @input="handleDropShadowColorChange" /></div>
                    <div class="action-title">透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="dropShadowAlpha"
                            @update:modelValue="handleDropShadowAlphaChange" />
                    </div>
                    <div class="action-title">模糊</div>
                    <div>
                        <FilterSlider label="模糊" :min="0" :max="20" :step="0.5" :modelValue="dropShadowBlur"
                            @update:modelValue="handleDropShadowBlurChange" />
                    </div>
                    <div class="action-title">质量</div>
                    <div>
                        <FilterSlider label="质量" :min="1" :max="10" :step="1" :modelValue="dropShadowQuality"
                            @update:modelValue="handleDropShadowQualityChange" />
                    </div>
                </template>

                <!-- 光晕滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'glow'">
                    <div class="action-title">距离</div>
                    <div>
                        <FilterSlider label="距离" :min="0" :max="50" :step="1" :modelValue="glowDistance"
                            @update:modelValue="handleGlowDistanceChange" />
                    </div>
                    <div class="action-title">外部强度</div>
                    <div>
                        <FilterSlider label="外部" :min="0" :max="10" :step="0.1" :modelValue="glowOuterStrength"
                            @update:modelValue="handleGlowOuterStrengthChange" />
                    </div>
                    <div class="action-title">内部强度</div>
                    <div>
                        <FilterSlider label="内部" :min="0" :max="10" :step="0.1" :modelValue="glowInnerStrength"
                            @update:modelValue="handleGlowInnerStrengthChange" />
                    </div>
                    <div class="action-title">颜色</div>
                    <div><input type="color" :value="'#' + glowColor.toString(16).padStart(6, '0')"
                            @input="handleGlowColorChange" /></div>
                    <div class="action-title">质量</div>
                    <div>
                        <FilterSlider label="质量" :min="0.1" :max="1" :step="0.1" :modelValue="glowQuality"
                            @update:modelValue="handleGlowQualityChange" />
                    </div>
                </template>

                <!-- 川濑模糊滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'kawase-blur'">
                    <div class="action-title">模糊强度</div>
                    <div>
                        <FilterSlider label="模糊" :min="0" :max="20" :step="0.5" :modelValue="kawaseBlur"
                            @update:modelValue="handleKawaseBlurBlurChange" />
                    </div>
                    <div class="action-title">质量</div>
                    <div>
                        <FilterSlider label="质量" :min="1" :max="10" :step="1" :modelValue="kawaseQuality"
                            @update:modelValue="handleKawaseBlurQualityChange" />
                    </div>
                </template>

                <!-- 轮廓滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'outline'">
                    <div class="action-title">厚度</div>
                    <div>
                        <FilterSlider label="厚度" :min="0" :max="10" :step="0.5" :modelValue="outlineThickness"
                            @update:modelValue="handleOutlineThicknessChange" />
                    </div>
                    <div class="action-title">颜色</div>
                    <div><input type="color" :value="'#' + outlineColor.toString(16).padStart(6, '0')"
                            @input="handleOutlineColorChange" /></div>
                    <div class="action-title">质量</div>
                    <div>
                        <FilterSlider label="质量" :min="0.1" :max="1" :step="0.1" :modelValue="outlineQuality"
                            @update:modelValue="handleOutlineQualityChange" />
                    </div>
                </template>

                <!-- 像素化滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'pixelate'">
                    <div class="action-title">像素大小</div>
                    <div>
                        <FilterSlider label="大小" :min="1" :max="50" :step="1" :modelValue="pixelateSize"
                            @update:modelValue="handlePixelateSizeChange" />
                    </div>
                </template>

                <!-- 高级发光滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'advanced-bloom'">
                    <div class="action-title">阈值</div>
                    <div>
                        <FilterSlider label="阈值" :min="0" :max="1" :step="0.01" :modelValue="advancedBloomThreshold"
                            @update:modelValue="handleAdvancedBloomThresholdChange" />
                    </div>
                    <div class="action-title">发光强度</div>
                    <div>
                        <FilterSlider label="强度" :min="0" :max="5" :step="0.1" :modelValue="advancedBloomBloomScale"
                            @update:modelValue="handleAdvancedBloomBloomScaleChange" />
                    </div>
                    <div class="action-title">亮度</div>
                    <div>
                        <FilterSlider label="亮度" :min="0" :max="3" :step="0.1" :modelValue="advancedBloomBrightness"
                            @update:modelValue="handleAdvancedBloomBrightnessChange" />
                    </div>
                    <div class="action-title">模糊</div>
                    <div>
                        <FilterSlider label="模糊" :min="0" :max="20" :step="0.5" :modelValue="advancedBloomBlur"
                            @update:modelValue="handleAdvancedBloomBlurChange" />
                    </div>
                    <div class="action-title">质量</div>
                    <div>
                        <FilterSlider label="质量" :min="1" :max="10" :step="1" :modelValue="advancedBloomQuality"
                            @update:modelValue="handleAdvancedBloomQualityChange" />
                    </div>
                </template>

                <!-- 径向模糊滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'radial-blur'">
                    <div class="action-title">角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="180" :step="1" :modelValue="radialBlurAngle"
                            @update:modelValue="handleRadialBlurAngleChange" />
                    </div>
                    <div class="action-title">中心X</div>
                    <div>
                        <FilterSlider label="X" :min="-5000" :max="5000" :step="1" :modelValue="radialBlurCenterX"
                            @update:modelValue="handleRadialBlurCenterXChange" />
                    </div>
                    <div class="action-title">中心Y</div>
                    <div>
                        <FilterSlider label="Y" :min="-5000" :max="5000" :step="1" :modelValue="radialBlurCenterY"
                            @update:modelValue="handleRadialBlurCenterYChange" />
                    </div>
                    <div class="action-title">半径</div>
                    <div>
                        <FilterSlider label="半径" :min="-1" :max="500" :step="10" :modelValue="radialBlurRadius"
                            @update:modelValue="handleRadialBlurRadiusChange" />
                    </div>
                </template>

                <!-- 扭曲滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'twist'">
                    <div class="action-title">半径</div>
                    <div>
                        <FilterSlider label="半径" :min="50" :max="5000" :step="10" :modelValue="twistRadius"
                            @update:modelValue="handleTwistRadiusChange" />
                    </div>
                    <div class="action-title">角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="100" :step="0.1" :modelValue="twistAngle"
                            @update:modelValue="handleTwistAngleChange" />
                    </div>
                    <div class="action-title">偏移X</div>
                    <div>
                        <FilterSlider label="偏移X" :min="-500" :max="5000" :step="1" :modelValue="twistOffsetX"
                            @update:modelValue="handleTwistOffsetXChange" />
                    </div>
                    <div class="action-title">偏移Y</div>
                    <div>
                        <FilterSlider label="偏移Y" :min="-5000" :max="5000" :step="1" :modelValue="twistOffsetY"
                            @update:modelValue="handleTwistOffsetYChange" />
                    </div>
                </template>

                <!-- 缩放模糊滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'zoom-blur'">
                    <div class="action-title">强度</div>
                    <div>
                        <FilterSlider label="强度" :min="0" :max="1" :step="0.01" :modelValue="zoomBlurStrength"
                            @update:modelValue="handleZoomBlurStrengthChange" />
                    </div>
                    <div class="action-title">中心X</div>
                    <div>
                        <FilterSlider label="X" :min="-5000" :max="5000" :step="0.01" :modelValue="zoomBlurCenterX"
                            @update:modelValue="handleZoomBlurCenterXChange" />
                    </div>
                    <div class="action-title">中心Y</div>
                    <div>
                        <FilterSlider label="Y" :min="-5000" :max="5000" :step="0.01" :modelValue="zoomBlurCenterY"
                            @update:modelValue="handleZoomBlurCenterYChange" />
                    </div>
                    <div class="action-title">内半径</div>
                    <div>
                        <FilterSlider label="内半径" :min="0" :max="5000" :step="1" :modelValue="zoomBlurInnerRadius"
                            @update:modelValue="handleZoomBlurInnerRadiusChange" />
                    </div>
                    <div class="action-title">外半径</div>
                    <div>
                        <FilterSlider label="外半径" :min="-1" :max="5000" :step="10" :modelValue="zoomBlurRadius"
                            @update:modelValue="handleZoomBlurRadiusChange" />
                    </div>
                </template>

                <!-- 颜色渐变滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'color-gradient'">
                    <div class="action-title">渐变类型</div>
                    <div>
                        <FilterSlider label="类型" :min="0" :max="2" :step="1" :modelValue="colorGradientType"
                            @update:modelValue="handleColorGradientTypeChange" />
                    </div>
                    <div class="action-title">角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="360" :step="1" :modelValue="colorGradientAngle"
                            @update:modelValue="handleColorGradientAngleChange" />
                    </div>
                    <div class="action-title">透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="colorGradientAlpha"
                            @update:modelValue="handleColorGradientAlphaChange" />
                    </div>
                    <div class="action-title">最大颜色数</div>
                    <div>
                        <FilterSlider label="最大颜色数" :min="0" :max="10" :step="1" :modelValue="colorGradientMaxColors"
                            @update:modelValue="handleColorGradientMaxColorsChange" />
                    </div>
                    <div class="action-title">替换模式</div>
                    <div>
                        <ToggleSwitch :modelValue="colorGradientReplace"
                            @update:modelValue="handleColorGradientReplaceChange" />
                    </div>
                </template>

                <!-- 颜色映射滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'color-map'">
                    <div class="action-title">混合度</div>
                    <div>
                        <FilterSlider label="混合度" :min="0" :max="1" :step="0.01" :modelValue="colorMapMix"
                            @update:modelValue="handleColorMapMixChange" />
                    </div>
                    <div class="action-title">最近邻采样</div>
                    <div>
                        <ToggleSwitch :modelValue="colorMapNearest" @update:modelValue="handleColorMapNearestChange" />
                    </div>
                </template>

                <!-- 颜色叠加滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'color-overlay'">
                    <div class="action-title">颜色</div>
                    <div><input type="color" :value="'#' + colorOverlayColor.toString(16).padStart(6, '0')"
                            @change="handleColorOverlayColorChange" /></div>
                    <div class="action-title">透明度</div>
                    <div>
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="colorOverlayAlpha"
                            @update:modelValue="handleColorOverlayAlphaChange" />
                    </div>
                </template>

                <!-- 颜色替换滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'color-replace'">
                    <div class="action-title">原始颜色</div>
                    <div><input type="color" :value="'#' + colorReplaceOriginalColor.toString(16).padStart(6, '0')"
                            @change="handleColorReplaceOriginalColorChange" /></div>
                    <div class="action-title">新颜色</div>
                    <div><input type="color" :value="'#' + colorReplaceNewColor.toString(16).padStart(6, '0')"
                            @change="handleColorReplaceNewColorChange" /></div>
                    <div class="action-title">容差</div>
                    <div>
                        <FilterSlider label="容差" :min="0" :max="1" :step="0.01" :modelValue="colorReplaceEpsilon"
                            @update:modelValue="handleColorReplaceEpsilonChange" />
                    </div>
                </template>

                <!-- 卷积滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'convolution'">
                    <div class="action-title">卷积矩阵</div>
                    <div class="convolution-matrix">
                        <div v-for="(value, index) in convolutionMatrix" :key="index" class="matrix-cell">
                            <input type="number" :value="value" @input="handleConvolutionMatrixChange(index, $event)"
                                step="0.1" />
                        </div>
                    </div>
                    <div class="action-title">宽度</div>
                    <div>
                        <FilterSlider label="宽度" :min="1" :max="500" :step="1" :modelValue="convolutionWidth"
                            @update:modelValue="handleConvolutionWidthChange" />
                    </div>
                    <div class="action-title">高度</div>
                    <div>
                        <FilterSlider label="高度" :min="1" :max="500" :step="1" :modelValue="convolutionHeight"
                            @update:modelValue="handleConvolutionHeightChange" />
                    </div>
                </template>

                <!-- CRT显示器滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'crt'">
                    <div class="action-title">时间</div>
                    <div>
                        <FilterSlider label="时间" :min="0" :max="10" :step="0.1" :modelValue="crtTime"
                            @update:modelValue="handleCrtTimeChange" />
                    </div>
                    <div class="action-title">种子</div>
                    <div>
                        <FilterSlider label="种子" :min="0" :max="1" :step="0.01" :modelValue="crtSeed"
                            @update:modelValue="handleCrtSeedChange" />
                    </div>
                    <div class="action-title">曲率</div>
                    <div>
                        <FilterSlider label="曲率" :min="0" :max="10" :step="0.1" :modelValue="crtCurvature"
                            @update:modelValue="handleCrtCurvatureChange" />
                    </div>
                    <div class="action-title">线宽</div>
                    <div>
                        <FilterSlider label="线宽" :min="0" :max="10" :step="0.1" :modelValue="crtLineWidth"
                            @update:modelValue="handleCrtLineWidthChange" />
                    </div>
                    <div class="action-title">线对比度</div>
                    <div>
                        <FilterSlider label="线对比度" :min="0" :max="1" :step="0.01" :modelValue="crtLineContrast"
                            @update:modelValue="handleCrtLineContrastChange" />
                    </div>
                    <div class="action-title">垂直线</div>
                    <div>
                        <ToggleSwitch :modelValue="crtVerticalLine" @update:modelValue="handleCrtVerticalLineChange" />
                    </div>
                    <div class="action-title">噪声</div>
                    <div>
                        <FilterSlider label="噪声" :min="0" :max="1" :step="0.01" :modelValue="crtNoise"
                            @update:modelValue="handleCrtNoiseChange" />
                    </div>
                    <div class="action-title">噪声大小</div>
                    <div>
                        <FilterSlider label="噪声大小" :min="0" :max="10" :step="0.1" :modelValue="crtNoiseSize"
                            @update:modelValue="handleCrtNoiseSizeChange" />
                    </div>
                    <div class="action-title">暗角</div>
                    <div>
                        <FilterSlider label="暗角" :min="0" :max="1" :step="0.01" :modelValue="crtVignetting"
                            @update:modelValue="handleCrtVignettingChange" />
                    </div>
                    <div class="action-title">暗角透明度</div>
                    <div>
                        <FilterSlider label="暗角透明度" :min="0" :max="1" :step="0.01" :modelValue="crtVignettingAlpha"
                            @update:modelValue="handleCrtVignettingAlphaChange" />
                    </div>
                    <div class="action-title">暗角模糊</div>
                    <div>
                        <FilterSlider label="暗角模糊" :min="0" :max="10" :step="0.1" :modelValue="crtVignettingBlur"
                            @update:modelValue="handleCrtVignettingBlurChange" />
                    </div>
                </template>

                <!-- 点阵滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'dot'">
                    <div class="action-title">缩放</div>
                    <div>
                        <FilterSlider label="缩放" :min="0.1" :max="5" :step="0.1" :modelValue="dotScale"
                            @update:modelValue="handleDotScaleChange" />
                    </div>
                    <div class="action-title">角度</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="360" :step="1" :modelValue="dotAngle"
                            @update:modelValue="handleDotAngleChange" />
                    </div>
                </template>

                <!-- 浮雕滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'emboss'">
                    <div class="action-title">强度</div>
                    <div>
                        <FilterSlider label="强度" :min="0" :max="20" :step="0.5" :modelValue="embossStrength"
                            @update:modelValue="handleEmbossStrengthChange" />
                    </div>
                </template>

                <!-- 故障滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'glitch'">
                    <div class="action-title">故障效果</div>
                    <div>
                        <FilterSlider label="切片数量" :min="1" :max="20" :step="1" :modelValue="glitchSlices"
                            @update:modelValue="handleGlitchSlicesChange" />
                        <FilterSlider label="偏移量" :min="0" :max="500" :step="1" :modelValue="glitchOffset"
                            @update:modelValue="handleGlitchOffsetChange" />
                        <FilterSlider label="方向" :min="0" :max="360" :step="1" :modelValue="glitchDirection"
                            @update:modelValue="handleGlitchDirectionChange" />
                        <FilterSlider label="填充模式" :min="0" :max="4" :step="1" :modelValue="glitchFillMode"
                            @update:modelValue="handleGlitchFillModeChange" />
                        <FilterSlider label="随机种子" :min="0" :max="1000" :step="1" :modelValue="glitchSeed"
                            @update:modelValue="handleGlitchSeedChange" />
                        <FilterSlider label="最小尺寸" :min="1" :max="50" :step="1" :modelValue="glitchMinSize"
                            @update:modelValue="handleGlitchMinSizeChange" />
                        <FilterSlider label="采样尺寸" :min="64" :max="1024" :step="64" :modelValue="glitchSampleSize"
                            @update:modelValue="handleGlitchSampleSizeChange" />
                        <FilterSlider label="红色X偏移" :min="-50" :max="50" :step="1" :modelValue="glitchRedX"
                            @update:modelValue="handleGlitchRedXChange" />
                        <FilterSlider label="红色Y偏移" :min="-50" :max="50" :step="1" :modelValue="glitchRedY"
                            @update:modelValue="handleGlitchRedYChange" />
                        <FilterSlider label="绿色X偏移" :min="-50" :max="50" :step="1" :modelValue="glitchGreenX"
                            @update:modelValue="handleGlitchGreenXChange" />
                        <FilterSlider label="绿色Y偏移" :min="-50" :max="50" :step="1" :modelValue="glitchGreenY"
                            @update:modelValue="handleGlitchGreenYChange" />
                        <FilterSlider label="蓝色X偏移" :min="-50" :max="50" :step="1" :modelValue="glitchBlueX"
                            @update:modelValue="handleGlitchBlueXChange" />
                        <FilterSlider label="蓝色Y偏移" :min="-50" :max="50" :step="1" :modelValue="glitchBlueY"
                            @update:modelValue="handleGlitchBlueYChange" />
                    </div>
                    <div>
                        <ToggleSwitch label="平均分布" :modelValue="glitchAverage"
                            @update:modelValue="handleGlitchAverageChange" />
                    </div>
                </template>

                <!-- 神光滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'godray'">
                    <div class="action-title">神光效果</div>
                    <div>
                        <FilterSlider label="角度" :min="0" :max="360" :step="1" :modelValue="godrayAngle"
                            @update:modelValue="handleGodrayAngleChange" />
                        <FilterSlider label="强度" :min="0" :max="2" :step="0.1" :modelValue="godrayGain"
                            @update:modelValue="handleGodrayGainChange" />
                        <FilterSlider label="密度" :min="0.1" :max="10" :step="0.1" :modelValue="godrayLacunarity"
                            @update:modelValue="handleGodrayLacunarityChange" />
                        <FilterSlider label="时间" :min="0" :max="100" :step="0.1" :modelValue="godrayTime"
                            @update:modelValue="handleGodrayTimeChange" />
                        <FilterSlider label="中心X" :min="-1" :max="1" :step="0.01" :modelValue="godrayCenterX"
                            @update:modelValue="handleGodrayCenterXChange" />
                        <FilterSlider label="中心Y" :min="-1" :max="1" :step="0.01" :modelValue="godrayCenterY"
                            @update:modelValue="handleGodrayCenterYChange" />
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="godrayAlpha"
                            @update:modelValue="handleGodrayAlphaChange" />
                    </div>
                    <div>
                        <ToggleSwitch label="平行光线" :modelValue="godrayParallel"
                            @update:modelValue="handleGodrayParallelChange" />
                    </div>
                </template>

                <!-- 灰度滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'grayscale'">
                    <div class="action-title">灰度效果</div>
                    <div>
                        <p>此滤镜无需参数配置，将图像转换为灰度效果。</p>
                    </div>
                </template>

                <!-- HSL调整滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'hsl-adjustment'">
                    <div class="action-title">HSL调整</div>
                    <div>
                        <FilterSlider label="色相" :min="-180" :max="180" :step="1" :modelValue="hslHue"
                            @update:modelValue="handleHslHueChange" />
                        <FilterSlider label="饱和度" :min="-1" :max="1" :step="0.01" :modelValue="hslSaturation"
                            @update:modelValue="handleHslSaturationChange" />
                        <FilterSlider label="亮度" :min="-1" :max="1" :step="0.01" :modelValue="hslLightness"
                            @update:modelValue="handleHslLightnessChange" />
                        <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="hslAlpha"
                            @update:modelValue="handleHslAlphaChange" />
                    </div>
                    <div>
                        <ToggleSwitch label="着色模式" :modelValue="hslColorize"
                            @update:modelValue="handleHslColorizeChange" />
                    </div>
                </template>

                <!-- 运动模糊滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'motion-blur'">
                    <div class="action-title">运动模糊</div>
                    <div>
                        <FilterSlider label="速度X" :min="-50" :max="50" :step="1" :modelValue="motionBlurVelocityX"
                            @update:modelValue="handleMotionBlurVelocityXChange" />
                        <FilterSlider label="速度Y" :min="-50" :max="50" :step="1" :modelValue="motionBlurVelocityY"
                            @update:modelValue="handleMotionBlurVelocityYChange" />
                        <FilterSlider label="核心大小" :min="5" :max="25" :step="2" :modelValue="motionBlurKernelSize"
                            @update:modelValue="handleMotionBlurKernelSizeChange" />
                        <FilterSlider label="偏移量" :min="0" :max="10" :step="0.1" :modelValue="motionBlurOffset"
                            @update:modelValue="handleMotionBlurOffsetChange" />
                    </div>
                </template>

                <!-- 多色替换滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'multi-color-replace'">
                    <div class="action-title">多色替换</div>
                    <div>
                        <FilterSlider label="容差" :min="0" :max="1" :step="0.01" :modelValue="multiColorReplaceTolerance"
                            @update:modelValue="handleMultiColorReplaceToleranceChange" />
                        <FilterSlider label="最大颜色数" :min="1" :max="10" :step="1"
                            :modelValue="multiColorReplaceMaxColors"
                            @update:modelValue="handleMultiColorReplaceMaxColorsChange" />
                    </div>
                    <div>
                        <p>注意：颜色替换数组需要在代码中配置，此滤镜主要用于批量颜色替换。</p>
                    </div>
                </template>

                <!-- 老电影滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'old-film'">
                    <div class="action-title">老电影效果</div>
                    <div>
                        <FilterSlider label="棕褐色调" :min="0" :max="1" :step="0.01" :modelValue="oldFilmSepia"
                            @update:modelValue="handleOldFilmSepiaChange" />
                        <FilterSlider label="噪点强度" :min="0" :max="1" :step="0.01" :modelValue="oldFilmNoise"
                            @update:modelValue="handleOldFilmNoiseChange" />
                        <FilterSlider label="噪点大小" :min="0.1" :max="3" :step="0.1" :modelValue="oldFilmNoiseSize"
                            @update:modelValue="handleOldFilmNoiseSizeChange" />
                        <FilterSlider label="划痕频率" :min="0" :max="1" :step="0.01" :modelValue="oldFilmScratch"
                            @update:modelValue="handleOldFilmScratchChange" />
                        <FilterSlider label="划痕密度" :min="0" :max="1" :step="0.01" :modelValue="oldFilmScratchDensity"
                            @update:modelValue="handleOldFilmScratchDensityChange" />
                        <FilterSlider label="划痕宽度" :min="0.1" :max="3" :step="0.1" :modelValue="oldFilmScratchWidth"
                            @update:modelValue="handleOldFilmScratchWidthChange" />
                        <FilterSlider label="暗角半径" :min="0" :max="1" :step="0.01" :modelValue="oldFilmVignetting"
                            @update:modelValue="handleOldFilmVignettingChange" />
                        <FilterSlider label="暗角透明度" :min="0" :max="1" :step="0.01" :modelValue="oldFilmVignettingAlpha"
                            @update:modelValue="handleOldFilmVignettingAlphaChange" />
                        <FilterSlider label="暗角模糊" :min="0" :max="1" :step="0.01" :modelValue="oldFilmVignettingBlur"
                            @update:modelValue="handleOldFilmVignettingBlurChange" />
                        <FilterSlider label="随机种子" :min="0" :max="100" :step="1" :modelValue="oldFilmSeed"
                            @update:modelValue="handleOldFilmSeedChange" />
                    </div>
                </template>

                <!-- 反射滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'reflection'">
                    <div class="action-title">反射效果</div>
                    <div>
                        <ToggleSwitch label="镜像模式" :modelValue="reflectionMirror"
                            @update:modelValue="handleReflectionMirrorChange" />
                        <FilterSlider label="边界位置" :min="0" :max="1" :step="0.01" :modelValue="reflectionBoundary"
                            @update:modelValue="handleReflectionBoundaryChange" />
                        <div class="filter-group">
                            <label>振幅范围</label>
                            <FilterSlider label="最小振幅" :min="0" :max="50" :step="1" :modelValue="reflectionAmplitude[0]"
                                @update:modelValue="(value) => handleReflectionAmplitudeChange(value, 0)" />
                            <FilterSlider label="最大振幅" :min="0" :max="50" :step="1" :modelValue="reflectionAmplitude[1]"
                                @update:modelValue="(value) => handleReflectionAmplitudeChange(value, 1)" />
                        </div>
                        <div class="filter-group">
                            <label>波长范围</label>
                            <FilterSlider label="最小波长" :min="10" :max="200" :step="5"
                                :modelValue="reflectionWaveLength[0]"
                                @update:modelValue="(value) => handleReflectionWaveLengthChange(value, 0)" />
                            <FilterSlider label="最大波长" :min="10" :max="200" :step="5"
                                :modelValue="reflectionWaveLength[1]"
                                @update:modelValue="(value) => handleReflectionWaveLengthChange(value, 1)" />
                        </div>
                        <div class="filter-group">
                            <label>透明度范围</label>
                            <FilterSlider label="起始透明度" :min="0" :max="1" :step="0.01" :modelValue="reflectionAlpha[0]"
                                @update:modelValue="(value) => handleReflectionAlphaChange(value, 0)" />
                            <FilterSlider label="结束透明度" :min="0" :max="1" :step="0.01" :modelValue="reflectionAlpha[1]"
                                @update:modelValue="(value) => handleReflectionAlphaChange(value, 1)" />
                        </div>
                        <FilterSlider label="时间偏移" :min="0" :max="10" :step="0.1" :modelValue="reflectionTime"
                            @update:modelValue="handleReflectionTimeChange" />
                    </div>
                </template>

                <!-- RGB分离滤镜参数 -->
                <template v-if="EffectTypes[selectedEffectType].value === 'rgb-split'">
                    <div class="action-title">RGB分离效果</div>
                    <div>
                        <div class="filter-group">
                            <label>红色通道偏移</label>
                            <FilterSlider label="X偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitRed[0]"
                                @update:modelValue="(value) => handleRgbSplitRedChange(value, 0)" />
                            <FilterSlider label="Y偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitRed[1]"
                                @update:modelValue="(value) => handleRgbSplitRedChange(value, 1)" />
                        </div>
                        <div class="filter-group">
                            <label>绿色通道偏移</label>
                            <FilterSlider label="X偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitGreen[0]"
                                @update:modelValue="(value) => handleRgbSplitGreenChange(value, 0)" />
                            <FilterSlider label="Y偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitGreen[1]"
                                @update:modelValue="(value) => handleRgbSplitGreenChange(value, 1)" />
                        </div>
                        <div class="filter-group">
                            <label>蓝色通道偏移</label>
                            <FilterSlider label="X偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitBlue[0]"
                                @update:modelValue="(value) => handleRgbSplitBlueChange(value, 0)" />
                            <FilterSlider label="Y偏移" :min="-50" :max="50" :step="1" :modelValue="rgbSplitBlue[1]"
                                @update:modelValue="(value) => handleRgbSplitBlueChange(value, 1)" />
                        </div>
                    </div>
                </template>
                <!-- Shockwave Filter -->
                <template v-if="EffectTypes[selectedEffectType].value === 'shockwave'">
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label>冲击波中心</label>
                            <FilterSlider label="X坐标" :min="0" :max="1" :step="0.01" :modelValue="shockwaveCenterX"
                                @update:modelValue="handleShockwaveCenterXChange" />
                            <FilterSlider label="Y坐标" :min="0" :max="1" :step="0.01" :modelValue="shockwaveCenterY"
                                @update:modelValue="handleShockwaveCenterYChange" />
                        </div>
                        <div class="filter-group">
                            <label>冲击波参数</label>
                            <FilterSlider label="振幅" :min="0" :max="100" :step="1" :modelValue="shockwaveAmplitude"
                                @update:modelValue="handleShockwaveAmplitudeChange" />
                            <FilterSlider label="波长" :min="1" :max="500" :step="1" :modelValue="shockwaveWavelength"
                                @update:modelValue="handleShockwaveWavelengthChange" />
                            <FilterSlider label="亮度" :min="0" :max="2" :step="0.1" :modelValue="shockwaveBrightness"
                                @update:modelValue="handleShockwaveBrightnessChange" />
                        </div>
                        <div class="filter-group">
                            <label>动画参数</label>
                            <FilterSlider label="速度" :min="0" :max="1000" :step="10" :modelValue="shockwaveSpeed"
                                @update:modelValue="handleShockwaveSpeedChange" />
                            <FilterSlider label="半径" :min="-1" :max="500" :step="1" :modelValue="shockwaveRadius"
                                @update:modelValue="handleShockwaveRadiusChange" />
                            <FilterSlider label="时间" :min="0" :max="10" :step="0.1" :modelValue="shockwaveTime"
                                @update:modelValue="handleShockwaveTimeChange" />
                        </div>
                    </div>
                </template>

                <!-- Simple Lightmap Filter -->
                <template v-if="EffectTypes[selectedEffectType].value === 'simple-lightmap'">
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label>光照贴图参数</label>
                            <FilterSlider label="颜色" :min="0x000000" :max="0xFFFFFF" :step="1"
                                :modelValue="simpleLightmapColor"
                                @update:modelValue="handleSimpleLightmapColorChange" />
                            <FilterSlider label="透明度" :min="0" :max="1" :step="0.01" :modelValue="simpleLightmapAlpha"
                                @update:modelValue="handleSimpleLightmapAlphaChange" />
                        </div>
                    </div>
                </template>

                <!-- Tilt Shift Filter -->
                <template v-if="EffectTypes[selectedEffectType].value === 'tilt-shift'">
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label>移轴参数</label>
                            <FilterSlider label="模糊强度" :min="0" :max="200" :step="1" :modelValue="tiltShiftBlur"
                                @update:modelValue="handleTiltShiftBlurChange" />
                            <FilterSlider label="渐变模糊" :min="0" :max="1000" :step="10"
                                :modelValue="tiltShiftGradientBlur"
                                @update:modelValue="handleTiltShiftGradientBlurChange" />
                            <FilterSlider label="起始点X" :min="0" :max="1920" :step="1" :modelValue="tiltShiftStart.x"
                                @update:modelValue="handleTiltShiftStartXChange" />
                            <FilterSlider label="起始点Y" :min="0" :max="1080" :step="1" :modelValue="tiltShiftStart.y"
                                @update:modelValue="handleTiltShiftStartYChange" />
                            <FilterSlider label="结束点X" :min="0" :max="1920" :step="1" :modelValue="tiltShiftEnd.x"
                                @update:modelValue="handleTiltShiftEndXChange" />
                            <FilterSlider label="结束点Y" :min="0" :max="1080" :step="1" :modelValue="tiltShiftEnd.y"
                                @update:modelValue="handleTiltShiftEndYChange" />
                        </div>
                    </div>
                </template>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ActionItemHead from './ActionItemHead.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import Dropdown from '../../common/Dropdown.vue';
import FilterSlider from '../../common/FilterSlider.vue';
import { useCommonState } from '../../../script/common/common-action-item';
import CanvasManager from '../../../script/render/canvas-manager';
import * as PIXI from 'pixi.js';
import { createStippleTransparencyFilter } from '../../../script/common/effect';
import {
    BloomFilter,
    AdjustmentFilter,
    AdvancedBloomFilter,
    AsciiFilter,
    BevelFilter,
    BulgePinchFilter,
    ColorGradientFilter,
    ColorMapFilter,
    ColorOverlayFilter,
    ColorReplaceFilter,
    ConvolutionFilter,
    CrossHatchFilter,
    CRTFilter,
    DotFilter,
    DropShadowFilter,
    EmbossFilter,
    GlitchFilter,
    GlowFilter,
    GodrayFilter,
    GrayscaleFilter,
    HslAdjustmentFilter,
    KawaseBlurFilter,
    MotionBlurFilter,
    MultiColorReplaceFilter,
    OldFilmFilter,
    OutlineFilter,
    PixelateFilter,
    RadialBlurFilter,
    ReflectionFilter,
    RGBSplitFilter,
    ShockwaveFilter,
    SimpleLightmapFilter,
    TiltShiftFilter,
    TwistFilter,
    ZoomBlurFilter
} from 'pixi-filters';
import ActionBottomLine from '../../common/ActionBottomLine.vue';

const props = defineProps<{
    title: string;
    id: number;
}>();

const { action, actionItem } = useCommonState(props.title, props.id);

// 特效操作模式
const EffectOperaMode = [
    { value: "add", label: "添加特效" },
    { value: "remove", label: "移除特效" },
    { value: "clear", label: "清除所有特效" }
];

// 特效类型
const EffectTypes = [
    { value: "blur", label: "🌫️ 模糊" },
    { value: "brightness", label: "☀️ 亮度" },
    { value: "contrast", label: "🔆 对比度" },
    { value: "saturation", label: "🎨 饱和度" },
    { value: "stipple", label: "⚪ 点阵半透" },
    { value: "bloom", label: "✨ 发光" },
    // 新增的 PixiJS Filters
    { value: "adjustment", label: "🎛️ 色彩调整" },
    { value: "advanced-bloom", label: "🌟 高级发光" },
    { value: "ascii", label: "📝 ASCII艺术" },
    { value: "backdrop-blur", label: "🌁 背景模糊" },
    { value: "bevel", label: "📐 斜面" },
    { value: "bulge-pinch", label: "🔍 凸起收缩" },
    { value: "color-gradient", label: "🌈 颜色渐变" },
    { value: "color-map", label: "🗺️ 颜色映射" },
    { value: "color-overlay", label: "🎨 颜色叠加" },
    { value: "color-replace", label: "🔄 颜色替换" },
    { value: "convolution", label: "🔢 卷积" },
    { value: "cross-hatch", label: "✖️ 交叉阴影" },
    { value: "crt", label: "📺 CRT显示器" },
    { value: "dot", label: "⚫ 点阵" },
    { value: "drop-shadow", label: "🌑 投影" },
    { value: "emboss", label: "🏛️ 浮雕" },
    { value: "glitch", label: "📺 故障" },
    { value: "glow", label: "💫 光晕" },
    { value: "godray", label: "☀️ 神光" },
    { value: "grayscale", label: "⚫ 灰度" },
    { value: "hsl-adjustment", label: "🎨 HSL调整" },
    { value: "kawase-blur", label: "🌫️ 川濑模糊" },
    { value: "motion-blur", label: "💨 运动模糊" },
    { value: "multi-color-replace", label: "🎨 多色替换" },
    { value: "old-film", label: "🎬 老电影" },
    { value: "outline", label: "⭕ 轮廓" },
    { value: "pixelate", label: "🔲 像素化" },
    { value: "radial-blur", label: "🌀 径向模糊" },
    { value: "reflection", label: "🪞 反射" },
    { value: "rgb-split", label: "🔴 分离RGB" },
    // { value: "shockwave", label: "💥 冲击波" },
    // { value: "simple-lightmap", label: "💡 简单光照" },
    // { value: "simplex-noise", label: "📊 噪声" },
    { value: "tilt-shift", label: "📷 移轴" },
    { value: "twist", label: "🌀 扭曲" },
    { value: "zoom-blur", label: "🔍 缩放模糊" },
];

const selectedOption = ref(0);
const selectedEffectType = ref(0);
const duration = ref(1000);

// 各种特效参数
const blurValue = ref(5);
const brightnessValue = ref(1);
const contrastValue = ref(1);
const saturationValue = ref(1);
const stippleTransparency = ref(0.5);
const stippleDotSize = ref(4);
const bloomBlur = ref(2);
const bloomQuality = ref(4);
const bloomKernelSize = ref(5);

// 新增滤镜参数
// Adjustment Filter
const adjustmentGamma = ref(1);
const adjustmentSaturation = ref(1);
const adjustmentContrast = ref(1);
const adjustmentBrightness = ref(1);
const adjustmentRed = ref(1);
const adjustmentGreen = ref(1);
const adjustmentBlue = ref(1);
const adjustmentAlpha = ref(1);

// Advanced Bloom Filter
const advancedBloomThreshold = ref(0.5);
const advancedBloomBloomScale = ref(1);
const advancedBloomBrightness = ref(1);
const advancedBloomBlur = ref(8);
const advancedBloomQuality = ref(4);

// ASCII Filter
const asciiSize = ref(8);

// Backdrop Blur Filter
const backdropBlurStrength = ref(8);
const backdropBlurQuality = ref(4);

// Bevel Filter
const bevelRotation = ref(45);
const bevelThickness = ref(2);
const bevelLightColor = ref(0xffffff);
const bevelLightAlpha = ref(0.7);
const bevelShadowColor = ref(0x000000);
const bevelShadowAlpha = ref(0.7);

// Bulge Pinch Filter
const bulgePinchRadius = ref(100);
const bulgePinchStrength = ref(0.5);
const bulgePinchCenterX = ref(0.5);
const bulgePinchCenterY = ref(0.5);

// Color Gradient Filter
const colorGradientType = ref(0);
const colorGradientStops = ref([]);
const colorGradientAngle = ref(90);
const colorGradientAlpha = ref(1);
const colorGradientMaxColors = ref(0);
const colorGradientReplace = ref(false);

// Color Map Filter
const colorMapColorSize = ref(1);
const colorMapNearest = ref(false);
const colorMapMix = ref(1);

// Color Overlay Filter
const colorOverlayColor = ref(0x000000);
const colorOverlayAlpha = ref(1);

// Color Replace Filter
const colorReplaceOriginalColor = ref(0xff0000);
const colorReplaceNewColor = ref(0x00ff00);
const colorReplaceEpsilon = ref(0.4);

// Convolution Filter
const convolutionMatrix = ref([0, 0, 0, 0, 1, 0, 0, 0, 0]);
const convolutionWidth = ref(200);
const convolutionHeight = ref(200);

// Cross Hatch Filter
// 无特殊参数

// CRT Filter
const crtCurvature = ref(1);
const crtLineWidth = ref(1);
const crtLineContrast = ref(0.25);
const crtVerticalLine = ref(false);
const crtNoise = ref(0.3);
const crtNoiseSize = ref(1);
const crtSeed = ref(0);
const crtVignetting = ref(0.3);
const crtVignettingAlpha = ref(1);
const crtVignettingBlur = ref(0.3);
const crtTime = ref(0);

// Dot Filter
const dotScale = ref(1);
const dotAngle = ref(5);

// Drop Shadow Filter
const dropShadowRotation = ref(45);
const dropShadowDistance = ref(5);
const dropShadowColor = ref(0x000000);
const dropShadowAlpha = ref(0.5);
const dropShadowShadowOnly = ref(false);
const dropShadowBlur = ref(2);
const dropShadowQuality = ref(3);
const dropShadowKernelSize = ref(5);

// Emboss Filter
const embossStrength = ref(5);

// Glitch Filter
const glitchSlices = ref(5);
const glitchOffset = ref(100);
const glitchDirection = ref(0);
const glitchFillMode = ref(0);
const glitchSeed = ref(0);
const glitchAverage = ref(false);
const glitchMinSize = ref(8);
const glitchSampleSize = ref(512);
const glitchRedX = ref(0);
const glitchRedY = ref(0);
const glitchGreenX = ref(0);
const glitchGreenY = ref(0);
const glitchBlueX = ref(0);
const glitchBlueY = ref(0);

// Glow Filter
const glowDistance = ref(10);
const glowOuterStrength = ref(4);
const glowInnerStrength = ref(0);
const glowColor = ref(0xffffff);
const glowQuality = ref(0.1);
const glowKnockout = ref(false);

// Godray Filter
const godrayAngle = ref(30);
const godrayGain = ref(0.5);
const godrayLacunarity = ref(2.5);
const godrayParallel = ref(true);
const godrayTime = ref(0);
const godrayCenterX = ref(0);
const godrayCenterY = ref(0);
const godrayAlpha = ref(1.0);

// Grayscale Filter
// 无特殊参数

// HSL Adjustment Filter
const hslHue = ref(0);
const hslSaturation = ref(0);
const hslLightness = ref(0);
const hslColorize = ref(false);
const hslAlpha = ref(1);

// Kawase Blur Filter
const kawaseBlur = ref(4);
const kawaseQuality = ref(3);
const kawaseClamp = ref(false);

// Motion Blur Filter
const motionBlurVelocityX = ref(0);
const motionBlurVelocityY = ref(0);
const motionBlurKernelSize = ref(5);
const motionBlurOffset = ref(0);

// Multi Color Replace Filter
const multiColorReplaceReplacements = ref([]);
const multiColorReplaceTolerance = ref(0.05);
const multiColorReplaceMaxColors = ref(1);

// Old Film Filter
const oldFilmSepia = ref(0.3);
const oldFilmNoise = ref(0.3);
const oldFilmNoiseSize = ref(1);
const oldFilmScratch = ref(0.5);
const oldFilmScratchDensity = ref(0.3);
const oldFilmScratchWidth = ref(1);
const oldFilmVignetting = ref(0.3);
const oldFilmVignettingAlpha = ref(1);
const oldFilmVignettingBlur = ref(0.3);
const oldFilmSeed = ref(0);

// Outline Filter
const outlineThickness = ref(1);
const outlineColor = ref(0x000000);
const outlineQuality = ref(0.1);

// Pixelate Filter
const pixelateSize = ref(10);

// Radial Blur Filter
const radialBlurAngle = ref(5);
const radialBlurCenterX = ref(0);
const radialBlurCenterY = ref(0);
const radialBlurRadius = ref(-1);
const radialBlurKernelSize = ref(5);

// Reflection Filter
const reflectionBoundary = ref(0.5);
const reflectionAmplitude = ref([0, 20]);
const reflectionWaveLength = ref([30, 100]);
const reflectionAlpha = ref([1, 0]);
const reflectionMirror = ref(true);
const reflectionTime = ref(0);

// RGB Split Filter
const rgbSplitRed = ref<[number, number]>([-10, 0]);
const rgbSplitGreen = ref<[number, number]>([0, 10]);
const rgbSplitBlue = ref<[number, number]>([0, 0]);

// Shockwave Filter
const shockwaveCenterX = ref(0.5);
const shockwaveCenterY = ref(0.5);
const shockwaveAmplitude = ref(30);
const shockwaveWavelength = ref(160);
const shockwaveBrightness = ref(1);
const shockwaveSpeed = ref(500);
const shockwaveRadius = ref(-1);
const shockwaveTime = ref(0);

// Simple Lightmap Filter
const simpleLightmapTexture = ref(null);
const simpleLightmapColor = ref(0x000000);
const simpleLightmapAlpha = ref(1);



// Tilt Shift Filter
const tiltShiftBlur = ref(100);
const tiltShiftGradientBlur = ref(600);
const tiltShiftStart = ref({ x: 0, y: window.innerHeight / 2 });
const tiltShiftEnd = ref({ x: window.innerWidth, y: window.innerHeight / 2 });

// Twist Filter
const twistRadius = ref(200);
const twistAngle = ref(4);
const twistOffsetX = ref(0);
const twistOffsetY = ref(0);

// Zoom Blur Filter
const zoomBlurStrength = ref(0.1);
const zoomBlurCenterX = ref(0);
const zoomBlurCenterY = ref(0);
const zoomBlurInnerRadius = ref(0);
const zoomBlurRadius = ref(-1);


// Ticker管理
let oldFilmTicker: PIXI.Ticker | null = null;
let currentOldFilmFilter: OldFilmFilter | null = null;

const onSelectModel = (index: number) => {
    selectedOption.value = index;
    updateActionData();
};

const onSelectEffectType = (index: number) => {
    selectedEffectType.value = index;
    updateActionData();
};

const handleBlurChange = (value: number) => {
    blurValue.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleBrightnessChange = (value: number) => {
    brightnessValue.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleContrastChange = (value: number) => {
    contrastValue.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleSaturationChange = (value: number) => {
    saturationValue.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleStippleTransparencyChange = (value: number) => {
    stippleTransparency.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleStippleDotSizeChange = (value: number) => {
    stippleDotSize.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleBloomBlurChange = (value: number) => {
    bloomBlur.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleBloomQualityChange = (value: number) => {
    bloomQuality.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

const handleBloomKernelSizeChange = (value: number) => {
    bloomKernelSize.value = value;
    updateActionData();
    if (action.realTimePreview) {
        applyEffect();
    }
};

// 色彩调整滤镜处理函数
const handleAdjustmentGammaChange = (value: number) => {
    adjustmentGamma.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentSaturationChange = (value: number) => {
    adjustmentSaturation.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentContrastChange = (value: number) => {
    adjustmentContrast.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentBrightnessChange = (value: number) => {
    adjustmentBrightness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentRedChange = (value: number) => {
    adjustmentRed.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentGreenChange = (value: number) => {
    adjustmentGreen.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentBlueChange = (value: number) => {
    adjustmentBlue.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdjustmentAlphaChange = (value: number) => {
    adjustmentAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// ASCII滤镜处理函数
const handleAsciiSizeChange = (value: number) => {
    asciiSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 斜面滤镜处理函数
const handleBevelRotationChange = (value: number) => {
    bevelRotation.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBevelThicknessChange = (value: number) => {
    bevelThickness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBevelLightColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    bevelLightColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBevelLightAlphaChange = (value: number) => {
    bevelLightAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBevelShadowColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    bevelShadowColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBevelShadowAlphaChange = (value: number) => {
    bevelShadowAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 凸起收缩滤镜处理函数
const handleBulgePinchCenterXChange = (value: number) => {
    bulgePinchCenterX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBulgePinchCenterYChange = (value: number) => {
    bulgePinchCenterY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBulgePinchRadiusChange = (value: number) => {
    bulgePinchRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleBulgePinchStrengthChange = (value: number) => {
    bulgePinchStrength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 投影滤镜处理函数
const handleDropShadowRotationChange = (value: number) => {
    dropShadowRotation.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDropShadowDistanceChange = (value: number) => {
    dropShadowDistance.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDropShadowColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    dropShadowColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDropShadowAlphaChange = (value: number) => {
    dropShadowAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDropShadowBlurChange = (value: number) => {
    dropShadowBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDropShadowQualityChange = (value: number) => {
    dropShadowQuality.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 光晕滤镜处理函数
const handleGlowDistanceChange = (value: number) => {
    glowDistance.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlowOuterStrengthChange = (value: number) => {
    glowOuterStrength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlowInnerStrengthChange = (value: number) => {
    glowInnerStrength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlowColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    glowColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlowQualityChange = (value: number) => {
    glowQuality.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 川濑模糊滤镜处理函数
const handleKawaseBlurBlurChange = (value: number) => {
    kawaseBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleKawaseBlurQualityChange = (value: number) => {
    kawaseQuality.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 轮廓滤镜处理函数
const handleOutlineThicknessChange = (value: number) => {
    outlineThickness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOutlineColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    outlineColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOutlineQualityChange = (value: number) => {
    outlineQuality.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 像素化滤镜处理函数
const handlePixelateSizeChange = (value: number) => {
    pixelateSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 高级发光滤镜处理函数
const handleAdvancedBloomThresholdChange = (value: number) => {
    advancedBloomThreshold.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdvancedBloomBloomScaleChange = (value: number) => {
    advancedBloomBloomScale.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdvancedBloomBrightnessChange = (value: number) => {
    advancedBloomBrightness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdvancedBloomBlurChange = (value: number) => {
    advancedBloomBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleAdvancedBloomQualityChange = (value: number) => {
    advancedBloomQuality.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 颜色渐变滤镜处理函数
const handleColorGradientTypeChange = (value: number) => {
    colorGradientType.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorGradientAngleChange = (value: number) => {
    colorGradientAngle.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorGradientAlphaChange = (value: number) => {
    colorGradientAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorGradientMaxColorsChange = (value: number) => {
    colorGradientMaxColors.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorGradientReplaceChange = (value: boolean) => {
    colorGradientReplace.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 颜色映射滤镜处理函数
const handleColorMapMixChange = (value: number) => {
    colorMapMix.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorMapNearestChange = (value: boolean) => {
    colorMapNearest.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 颜色叠加滤镜处理函数
const handleColorOverlayColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    colorOverlayColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorOverlayAlphaChange = (value: number) => {
    colorOverlayAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 颜色替换滤镜处理函数
const handleColorReplaceOriginalColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    colorReplaceOriginalColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorReplaceNewColorChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    colorReplaceNewColor.value = parseInt(target.value.replace('#', ''), 16);
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleColorReplaceEpsilonChange = (value: number) => {
    colorReplaceEpsilon.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 卷积滤镜处理函数
const handleConvolutionMatrixChange = (index: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    convolutionMatrix.value[index] = parseFloat(target.value) || 0;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleConvolutionWidthChange = (value: number) => {
    convolutionWidth.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleConvolutionHeightChange = (value: number) => {
    convolutionHeight.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// CRT显示器滤镜处理函数
const handleCrtTimeChange = (value: number) => {
    crtTime.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtSeedChange = (value: number) => {
    crtSeed.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtCurvatureChange = (value: number) => {
    crtCurvature.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtLineWidthChange = (value: number) => {
    crtLineWidth.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtLineContrastChange = (value: number) => {
    crtLineContrast.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtVerticalLineChange = (value: boolean) => {
    crtVerticalLine.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtNoiseChange = (value: number) => {
    crtNoise.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtNoiseSizeChange = (value: number) => {
    crtNoiseSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtVignettingChange = (value: number) => {
    crtVignetting.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtVignettingAlphaChange = (value: number) => {
    crtVignettingAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleCrtVignettingBlurChange = (value: number) => {
    crtVignettingBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Dot Filter handlers
const handleDotScaleChange = (value: number) => {
    dotScale.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleDotAngleChange = (value: number) => {
    dotAngle.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Emboss Filter handlers
const handleEmbossStrengthChange = (value: number) => {
    embossStrength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Glitch Filter handlers
const handleGlitchSlicesChange = (value: number) => {
    glitchSlices.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchOffsetChange = (value: number) => {
    glitchOffset.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchDirectionChange = (value: number) => {
    glitchDirection.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchFillModeChange = (value: number) => {
    glitchFillMode.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchSeedChange = (value: number) => {
    glitchSeed.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchAverageChange = (value: boolean) => {
    glitchAverage.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchMinSizeChange = (value: number) => {
    glitchMinSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchSampleSizeChange = (value: number) => {
    glitchSampleSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchRedXChange = (value: number) => {
    glitchRedX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchRedYChange = (value: number) => {
    glitchRedY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchGreenXChange = (value: number) => {
    glitchGreenX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchGreenYChange = (value: number) => {
    glitchGreenY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchBlueXChange = (value: number) => {
    glitchBlueX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGlitchBlueYChange = (value: number) => {
    glitchBlueY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Godray Filter handlers
const handleGodrayAngleChange = (value: number) => {
    godrayAngle.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayGainChange = (value: number) => {
    godrayGain.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayLacunarityChange = (value: number) => {
    godrayLacunarity.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayParallelChange = (value: boolean) => {
    godrayParallel.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayTimeChange = (value: number) => {
    godrayTime.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayCenterXChange = (value: number) => {
    godrayCenterX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayCenterYChange = (value: number) => {
    godrayCenterY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleGodrayAlphaChange = (value: number) => {
    godrayAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// HSL Adjustment Filter handlers
const handleHslHueChange = (value: number) => {
    hslHue.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleHslSaturationChange = (value: number) => {
    hslSaturation.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleHslLightnessChange = (value: number) => {
    hslLightness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleHslColorizeChange = (value: boolean) => {
    hslColorize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleHslAlphaChange = (value: number) => {
    hslAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Motion Blur Filter handlers
const handleMotionBlurVelocityXChange = (value: number) => {
    motionBlurVelocityX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleMotionBlurVelocityYChange = (value: number) => {
    motionBlurVelocityY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleMotionBlurKernelSizeChange = (value: number) => {
    motionBlurKernelSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleMotionBlurOffsetChange = (value: number) => {
    motionBlurOffset.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Multi Color Replace Filter handlers
const handleMultiColorReplaceToleranceChange = (value: number) => {
    multiColorReplaceTolerance.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleMultiColorReplaceMaxColorsChange = (value: number) => {
    multiColorReplaceMaxColors.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 老电影滤镜处理函数
const handleOldFilmSepiaChange = (value: number) => {
    oldFilmSepia.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmNoiseChange = (value: number) => {
    oldFilmNoise.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmNoiseSizeChange = (value: number) => {
    oldFilmNoiseSize.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmScratchChange = (value: number) => {
    oldFilmScratch.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmScratchDensityChange = (value: number) => {
    oldFilmScratchDensity.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmScratchWidthChange = (value: number) => {
    oldFilmScratchWidth.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmVignettingChange = (value: number) => {
    oldFilmVignetting.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmVignettingAlphaChange = (value: number) => {
    oldFilmVignettingAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmVignettingBlurChange = (value: number) => {
    oldFilmVignettingBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleOldFilmSeedChange = (value: number) => {
    oldFilmSeed.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 反射滤镜处理函数
const handleReflectionMirrorChange = (value: boolean) => {
    reflectionMirror.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleReflectionBoundaryChange = (value: number) => {
    reflectionBoundary.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleReflectionAmplitudeChange = (value: number, index: number) => {
    reflectionAmplitude.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleReflectionWaveLengthChange = (value: number, index: number) => {
    reflectionWaveLength.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleReflectionAlphaChange = (value: number, index: number) => {
    reflectionAlpha.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleReflectionTimeChange = (value: number) => {
    reflectionTime.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// RGB分离滤镜处理函数
const handleRgbSplitRedChange = (value: number, index: number) => {
    rgbSplitRed.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleRgbSplitGreenChange = (value: number, index: number) => {
    rgbSplitGreen.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleRgbSplitBlueChange = (value: number, index: number) => {
    rgbSplitBlue.value[index] = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 冲击波滤镜处理函数
const handleShockwaveCenterXChange = (value: number) => {
    shockwaveCenterX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveCenterYChange = (value: number) => {
    shockwaveCenterY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveAmplitudeChange = (value: number) => {
    shockwaveAmplitude.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveWavelengthChange = (value: number) => {
    shockwaveWavelength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveBrightnessChange = (value: number) => {
    shockwaveBrightness.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveSpeedChange = (value: number) => {
    shockwaveSpeed.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveRadiusChange = (value: number) => {
    shockwaveRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleShockwaveTimeChange = (value: number) => {
    shockwaveTime.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 简单光照贴图滤镜处理函数
const handleSimpleLightmapColorChange = (value: number) => {
    simpleLightmapColor.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleSimpleLightmapAlphaChange = (value: number) => {
    simpleLightmapAlpha.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// Tilt Shift滤镜处理函数
const handleTiltShiftBlurChange = (value: number) => {
    tiltShiftBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTiltShiftGradientBlurChange = (value: number) => {
    tiltShiftGradientBlur.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTiltShiftStartXChange = (value: number) => {
    tiltShiftStart.value.x = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTiltShiftStartYChange = (value: number) => {
    tiltShiftStart.value.y = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTiltShiftEndXChange = (value: number) => {
    tiltShiftEnd.value.x = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTiltShiftEndYChange = (value: number) => {
    tiltShiftEnd.value.y = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 径向模糊滤镜处理函数
const handleRadialBlurAngleChange = (value: number) => {
    radialBlurAngle.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleRadialBlurCenterXChange = (value: number) => {
    radialBlurCenterX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleRadialBlurCenterYChange = (value: number) => {
    radialBlurCenterY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleRadialBlurRadiusChange = (value: number) => {
    radialBlurRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 扭曲滤镜处理函数
const handleTwistRadiusChange = (value: number) => {
    twistRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTwistAngleChange = (value: number) => {
    twistAngle.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTwistOffsetXChange = (value: number) => {
    twistOffsetX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleTwistOffsetYChange = (value: number) => {
    twistOffsetY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

// 缩放模糊滤镜处理函数
const handleZoomBlurStrengthChange = (value: number) => {
    zoomBlurStrength.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleZoomBlurCenterXChange = (value: number) => {
    zoomBlurCenterX.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleZoomBlurCenterYChange = (value: number) => {
    zoomBlurCenterY.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleZoomBlurInnerRadiusChange = (value: number) => {
    zoomBlurInnerRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const handleZoomBlurRadiusChange = (value: number) => {
    zoomBlurRadius.value = value;
    updateActionData();
    if (action.realTimePreview) applyEffect();
};

const updateActionData = () => {
    actionItem.actionData = {
        operationMode: EffectOperaMode[selectedOption.value].value,
        effectType: EffectTypes[selectedEffectType.value].value,
        duration: duration.value,
        parameters: {
            blur: blurValue.value,
            brightness: brightnessValue.value,
            contrast: contrastValue.value,
            saturation: saturationValue.value,
            stippleTransparency: stippleTransparency.value,
            stippleDotSize: stippleDotSize.value,
            bloomBlur: bloomBlur.value,
            bloomQuality: bloomQuality.value,
            bloomKernelSize: bloomKernelSize.value,
            // Adjustment filter parameters
            adjustmentGamma: adjustmentGamma.value,
            adjustmentSaturation: adjustmentSaturation.value,
            adjustmentContrast: adjustmentContrast.value,
            adjustmentBrightness: adjustmentBrightness.value,
            adjustmentRed: adjustmentRed.value,
            adjustmentGreen: adjustmentGreen.value,
            adjustmentBlue: adjustmentBlue.value,
            adjustmentAlpha: adjustmentAlpha.value,
            // Advanced Bloom filter parameters
            advancedBloomThreshold: advancedBloomThreshold.value,
            advancedBloomBloomScale: advancedBloomBloomScale.value,
            advancedBloomBrightness: advancedBloomBrightness.value,
            advancedBloomBlur: advancedBloomBlur.value,
            advancedBloomQuality: advancedBloomQuality.value,
            // Color Gradient filter parameters
            colorGradientType: colorGradientType.value,
            colorGradientStops: colorGradientStops.value,
            colorGradientAngle: colorGradientAngle.value,
            colorGradientAlpha: colorGradientAlpha.value,
            colorGradientMaxColors: colorGradientMaxColors.value,
            colorGradientReplace: colorGradientReplace.value,
            // Color Map filter parameters
            colorMapColorSize: colorMapColorSize.value,
            colorMapNearest: colorMapNearest.value,
            colorMapMix: colorMapMix.value,
            // Color Overlay filter parameters
            colorOverlayColor: colorOverlayColor.value,
            colorOverlayAlpha: colorOverlayAlpha.value,
            // Color Replace filter parameters
            colorReplaceOriginalColor: colorReplaceOriginalColor.value,
            colorReplaceNewColor: colorReplaceNewColor.value,
            colorReplaceEpsilon: colorReplaceEpsilon.value,
            // Convolution filter parameters
            convolutionMatrix: convolutionMatrix.value,
            convolutionWidth: convolutionWidth.value,
            convolutionHeight: convolutionHeight.value,
            // CRT filter parameters
            crtTime: crtTime.value,
            crtSeed: crtSeed.value,
            crtCurvature: crtCurvature.value,
            crtLineWidth: crtLineWidth.value,
            crtLineContrast: crtLineContrast.value,
            crtVerticalLine: crtVerticalLine.value,
            crtNoise: crtNoise.value,
            crtNoiseSize: crtNoiseSize.value,
            crtVignetting: crtVignetting.value,
            crtVignettingAlpha: crtVignettingAlpha.value,
            crtVignettingBlur: crtVignettingBlur.value,
            // Dot filter parameters
            dotScale: dotScale.value,
            dotAngle: dotAngle.value,
            // Emboss filter parameters
            embossStrength: embossStrength.value,
            // Glitch filter parameters
            glitchSlices: glitchSlices.value,
            glitchOffset: glitchOffset.value,
            glitchDirection: glitchDirection.value,
            glitchFillMode: glitchFillMode.value,
            glitchSeed: glitchSeed.value,
            glitchAverage: glitchAverage.value,
            glitchMinSize: glitchMinSize.value,
            glitchSampleSize: glitchSampleSize.value,
            glitchRedX: glitchRedX.value,
            glitchRedY: glitchRedY.value,
            glitchGreenX: glitchGreenX.value,
            glitchGreenY: glitchGreenY.value,
            glitchBlueX: glitchBlueX.value,
            glitchBlueY: glitchBlueY.value,
            // Godray filter parameters
            godrayAngle: godrayAngle.value,
            godrayGain: godrayGain.value,
            godrayLacunarity: godrayLacunarity.value,
            godrayParallel: godrayParallel.value,
            godrayTime: godrayTime.value,
            godrayCenterX: godrayCenterX.value,
            godrayCenterY: godrayCenterY.value,
            godrayAlpha: godrayAlpha.value,
            // HSL Adjustment filter parameters
            hslHue: hslHue.value,
            hslSaturation: hslSaturation.value,
            hslLightness: hslLightness.value,
            hslColorize: hslColorize.value,
            hslAlpha: hslAlpha.value,
            // Motion Blur filter parameters
            motionBlurVelocityX: motionBlurVelocityX.value,
            motionBlurVelocityY: motionBlurVelocityY.value,
            motionBlurKernelSize: motionBlurKernelSize.value,
            motionBlurOffset: motionBlurOffset.value,
            // Multi Color Replace filter parameters
            multiColorReplaceTolerance: multiColorReplaceTolerance.value,
            multiColorReplaceMaxColors: multiColorReplaceMaxColors.value,
            // Old Film filter parameters
            oldFilmSepia: oldFilmSepia.value,
            oldFilmNoise: oldFilmNoise.value,
            oldFilmNoiseSize: oldFilmNoiseSize.value,
            oldFilmScratch: oldFilmScratch.value,
            oldFilmScratchDensity: oldFilmScratchDensity.value,
            oldFilmScratchWidth: oldFilmScratchWidth.value,
            oldFilmVignetting: oldFilmVignetting.value,
            oldFilmVignettingAlpha: oldFilmVignettingAlpha.value,
            oldFilmVignettingBlur: oldFilmVignettingBlur.value,
            oldFilmSeed: oldFilmSeed.value,
            // Reflection filter parameters
            reflectionMirror: reflectionMirror.value,
            reflectionBoundary: reflectionBoundary.value,
            reflectionAmplitude: reflectionAmplitude.value,
            reflectionWaveLength: reflectionWaveLength.value,
            reflectionAlpha: reflectionAlpha.value,
            reflectionTime: reflectionTime.value,
            // RGB Split filter parameters
            rgbSplitRed: rgbSplitRed.value,
            rgbSplitGreen: rgbSplitGreen.value,
            rgbSplitBlue: rgbSplitBlue.value,
            // Shockwave filter parameters
            shockwaveCenterX: shockwaveCenterX.value,
            shockwaveCenterY: shockwaveCenterY.value,
            shockwaveAmplitude: shockwaveAmplitude.value,
            shockwaveWavelength: shockwaveWavelength.value,
            shockwaveBrightness: shockwaveBrightness.value,
            shockwaveSpeed: shockwaveSpeed.value,
            shockwaveRadius: shockwaveRadius.value,
            shockwaveTime: shockwaveTime.value,
            // Simple Lightmap filter parameters
            simpleLightmapTexture: simpleLightmapTexture.value,
            simpleLightmapColor: simpleLightmapColor.value,
            simpleLightmapAlpha: simpleLightmapAlpha.value,
            // Tilt Shift filter parameters
            tiltShiftBlur: tiltShiftBlur.value,
            tiltShiftGradientBlur: tiltShiftGradientBlur.value,
            tiltShiftStartX: tiltShiftStart.value.x,
            tiltShiftStartY: tiltShiftStart.value.y,
            tiltShiftEndX: tiltShiftEnd.value.x,
            tiltShiftEndY: tiltShiftEnd.value.y,
            // ASCII filter parameters
            asciiSize: asciiSize.value,
            // Bevel filter parameters
            bevelRotation: bevelRotation.value,
            bevelThickness: bevelThickness.value,
            bevelLightColor: bevelLightColor.value,
            bevelLightAlpha: bevelLightAlpha.value,
            bevelShadowColor: bevelShadowColor.value,
            bevelShadowAlpha: bevelShadowAlpha.value,
            // Bulge Pinch filter parameters
            bulgePinchCenterX: bulgePinchCenterX.value,
            bulgePinchCenterY: bulgePinchCenterY.value,
            bulgePinchRadius: bulgePinchRadius.value,
            bulgePinchStrength: bulgePinchStrength.value,
            // Drop Shadow filter parameters
            dropShadowRotation: dropShadowRotation.value,
            dropShadowDistance: dropShadowDistance.value,
            dropShadowColor: dropShadowColor.value,
            dropShadowAlpha: dropShadowAlpha.value,
            dropShadowBlur: dropShadowBlur.value,
            dropShadowQuality: dropShadowQuality.value,
            // Glow filter parameters
            glowDistance: glowDistance.value,
            glowOuterStrength: glowOuterStrength.value,
            glowInnerStrength: glowInnerStrength.value,
            glowColor: glowColor.value,
            glowQuality: glowQuality.value,
            // Kawase Blur filter parameters
            kawaseBlurBlur: kawaseBlur.value,
            kawaseBlurQuality: kawaseQuality.value,
            // Outline filter parameters
            outlineThickness: outlineThickness.value,
            outlineColor: outlineColor.value,
            outlineQuality: outlineQuality.value,
            // Pixelate filter parameters
            pixelateSize: pixelateSize.value,
            // Radial Blur filter parameters
            radialBlurAngle: radialBlurAngle.value,
            radialBlurCenterX: radialBlurCenterX.value,
            radialBlurCenterY: radialBlurCenterY.value,
            radialBlurRadius: radialBlurRadius.value,
            // Twist filter parameters
            twistRadius: twistRadius.value,
            twistAngle: twistAngle.value,
            twistOffsetX: twistOffsetX.value,
            twistOffsetY: twistOffsetY.value,
            // Zoom Blur filter parameters
            zoomBlurStrength: zoomBlurStrength.value,
            zoomBlurCenterX: zoomBlurCenterX.value,
            zoomBlurCenterY: zoomBlurCenterY.value,
            zoomBlurInnerRadius: zoomBlurInnerRadius.value,
            zoomBlurRadius: zoomBlurRadius.value
        }
    };
};

// 存储当前预览的滤镜，用于实时预览时的管理
let currentPreviewFilter: PIXI.Filter | null = null;

const applyEffect = () => {
    const canvas = CanvasManager.getInstance();
    const operationMode = EffectOperaMode[selectedOption.value].value;

    if (operationMode === 'clear') {
        // 清除所有特效
        canvas.viewport.filters = [];
        currentPreviewFilter = null;
        
        // 清理OldFilm ticker
        if (oldFilmTicker) {
            oldFilmTicker.stop();
            oldFilmTicker.destroy();
            oldFilmTicker = null;
        }
        currentOldFilmFilter = null;
        return;
    }

    if (operationMode === 'remove') {
        // 移除特效 - 这里可以根据需要实现特定特效的移除逻辑
        canvas.viewport.filters = [];
        currentPreviewFilter = null;
        
        // 清理OldFilm ticker
        if (oldFilmTicker) {
            oldFilmTicker.stop();
            oldFilmTicker.destroy();
            oldFilmTicker = null;
        }
        currentOldFilmFilter = null;
        return;
    }

    if (operationMode === 'add') {
        const effectType = EffectTypes[selectedEffectType.value].value;

        // 如果是实时预览，先移除之前的预览滤镜
        if (action.realTimePreview && currentPreviewFilter) {
            const filters = canvas.viewport.filters || [];
            const index = filters.indexOf(currentPreviewFilter);
            if (index !== -1) {
                filters.splice(index, 1);
                canvas.viewport.filters = filters;
            }
            
            // 如果移除的是OldFilm滤镜，清理ticker
            if (currentPreviewFilter === currentOldFilmFilter && oldFilmTicker) {
                oldFilmTicker.stop();
                oldFilmTicker.destroy();
                oldFilmTicker = null;
                currentOldFilmFilter = null;
            }
        }

        const filters: PIXI.Filter[] = canvas.viewport.filters ? [...canvas.viewport.filters] : [];

        let newFilter: PIXI.Filter | null = null;

        switch (effectType) {
            case 'blur':
                newFilter = new PIXI.BlurFilter();
                (newFilter as PIXI.BlurFilter).blur = blurValue.value;
                break;

            case 'brightness':
                newFilter = new PIXI.ColorMatrixFilter();
                (newFilter as PIXI.ColorMatrixFilter).brightness(brightnessValue.value, false);
                break;
            case 'contrast':
                newFilter = new PIXI.ColorMatrixFilter();
                (newFilter as PIXI.ColorMatrixFilter).contrast(contrastValue.value, false);
                break;
            case 'saturation':
                newFilter = new PIXI.ColorMatrixFilter();
                (newFilter as PIXI.ColorMatrixFilter).saturate(saturationValue.value, false);
                break;
            case 'stipple':
                newFilter = createStippleTransparencyFilter(stippleTransparency.value, stippleDotSize.value);
                break;
            case 'bloom':
                newFilter = new BloomFilter(bloomBlur.value, bloomQuality.value, undefined, bloomKernelSize.value);
                break;
            case 'adjustment':
                newFilter = new AdjustmentFilter({
                    gamma: adjustmentGamma.value,
                    saturation: adjustmentSaturation.value,
                    contrast: adjustmentContrast.value,
                    brightness: adjustmentBrightness.value,
                    red: adjustmentRed.value,
                    green: adjustmentGreen.value,
                    blue: adjustmentBlue.value,
                    alpha: adjustmentAlpha.value
                });
                break;
            case 'emboss':
                newFilter = new EmbossFilter(embossStrength.value);
                break;
            case 'glitch':
                newFilter = new GlitchFilter({
                    slices: glitchSlices.value,
                    offset: glitchOffset.value,
                    direction: glitchDirection.value,
                    fillMode: glitchFillMode.value,
                    seed: glitchSeed.value,
                    average: glitchAverage.value,
                    minSize: glitchMinSize.value,
                    sampleSize: glitchSampleSize.value,
                    red: [glitchRedX.value, glitchRedY.value],
                    green: [glitchGreenX.value, glitchGreenY.value],
                    blue: [glitchBlueX.value, glitchBlueY.value]
                });
                break;
            case 'godray':
                newFilter = new GodrayFilter({
                    angle: godrayAngle.value,
                    gain: godrayGain.value,
                    lacunarity: godrayLacunarity.value,
                    parallel: godrayParallel.value,
                    time: godrayTime.value,
                    center: [godrayCenterX.value, godrayCenterY.value],
                    alpha: godrayAlpha.value
                });
                break;
            case 'grayscale':
                newFilter = new GrayscaleFilter();
                break;
            case 'hsl-adjustment':
                newFilter = new HslAdjustmentFilter({
                    hue: hslHue.value,
                    saturation: hslSaturation.value,
                    lightness: hslLightness.value,
                    colorize: hslColorize.value,
                    alpha: hslAlpha.value
                });
                break;
            case 'motion-blur':
                newFilter = new MotionBlurFilter(
                    [motionBlurVelocityX.value, motionBlurVelocityY.value],
                    motionBlurKernelSize.value,
                    motionBlurOffset.value
                );
                break;
            case 'multi-color-replace':
                // Create a simple color replacement array (red to blue as example)
                const replacements: any = [
                    [0xff0000, 0x0000ff], // Replace red with blue
                ];
                newFilter = new MultiColorReplaceFilter(
                    replacements,
                    multiColorReplaceTolerance.value,
                    multiColorReplaceMaxColors.value
                );
                break;
            case 'old-film':
                newFilter = new OldFilmFilter({
                    sepia: oldFilmSepia.value,
                    noise: oldFilmNoise.value,
                    noiseSize: oldFilmNoiseSize.value,
                    scratch: oldFilmScratch.value,
                    scratchDensity: oldFilmScratchDensity.value,
                    scratchWidth: oldFilmScratchWidth.value,
                    vignetting: oldFilmVignetting.value,
                    vignettingAlpha: oldFilmVignettingAlpha.value,
                    vignettingBlur: oldFilmVignettingBlur.value,
                }, oldFilmSeed.value);
                
                // 保存当前滤镜引用
                currentOldFilmFilter = newFilter as OldFilmFilter;
                
                // 创建ticker来自动更新种子值
                if (oldFilmTicker) {
                    oldFilmTicker.stop();
                    oldFilmTicker.destroy();
                }
                
                oldFilmTicker = new PIXI.Ticker();
                oldFilmTicker.add(() => {
                    if (currentOldFilmFilter) {
                        currentOldFilmFilter.seed = Math.random();
                    }
                });
                oldFilmTicker.start();
                break;
            case 'reflection':
                newFilter = new ReflectionFilter({
                    mirror: reflectionMirror.value,
                    boundary: reflectionBoundary.value,
                    amplitude: reflectionAmplitude.value,
                    waveLength: reflectionWaveLength.value,
                    alpha: reflectionAlpha.value,
                    time: reflectionTime.value
                });
                break;
            case 'rgb-split':
                newFilter = new RGBSplitFilter(
                    rgbSplitRed.value,
                    rgbSplitGreen.value,
                    rgbSplitBlue.value
                );
                break;
            case 'shockwave':
                newFilter = new ShockwaveFilter({
                    //@ts-ignore
                    center: ([shockwaveCenterX.value, shockwaveCenterY.value] ) as any,
                    amplitude: shockwaveAmplitude.value,
                    wavelength: shockwaveWavelength.value,
                    brightness: shockwaveBrightness.value,
                    speed: shockwaveSpeed.value,
                    radius: shockwaveRadius.value,
                    time: shockwaveTime.value
                });
                break;
            // case 'simple-lightmap':
            //     newFilter = new SimpleLightmapFilter(
            //         simpleLightmapTexture.value,
            //         simpleLightmapColor.value,
            //         simpleLightmapAlpha.value
            //     );
            //     break;
            case 'tilt-shift':
                newFilter = new TiltShiftFilter(
                    tiltShiftBlur.value,
                    tiltShiftGradientBlur.value,
                    new PIXI.Point(tiltShiftStart.value.x, tiltShiftStart.value.y),
                    new PIXI.Point(tiltShiftEnd.value.x, tiltShiftEnd.value.y)
                );
                break;
            case 'dot':
                newFilter = new DotFilter(
                    dotScale.value,
                    dotAngle.value
                );
                break;
            case 'crt':
                newFilter = new CRTFilter({
                    time: crtTime.value,
                    seed: crtSeed.value,
                    curvature: crtCurvature.value,
                    lineWidth: crtLineWidth.value,
                    lineContrast: crtLineContrast.value,
                    verticalLine: crtVerticalLine.value,
                    noise: crtNoise.value,
                    noiseSize: crtNoiseSize.value,
                    vignetting: crtVignetting.value,
                    vignettingAlpha: crtVignettingAlpha.value,
                    vignettingBlur: crtVignettingBlur.value
                });
                break;
            case 'cross-hatch':
                newFilter = new CrossHatchFilter();
                break;
            case 'convolution':
                newFilter = new ConvolutionFilter(convolutionMatrix.value, convolutionWidth.value, convolutionHeight.value);
                break;
            case 'color-replace':
                newFilter = new ColorReplaceFilter(colorReplaceOriginalColor.value, colorReplaceNewColor.value, colorReplaceEpsilon.value);
                break;
            case 'color-overlay':
                newFilter = new ColorOverlayFilter(colorOverlayColor.value, colorOverlayAlpha.value);
                break;
            case 'color-map':
                // 注意：ColorMapFilter需要一个颜色映射纹理，这里使用默认值
                // 在实际使用中，应该提供一个有效的颜色映射纹理
                newFilter = new ColorMapFilter(null, colorMapNearest.value, colorMapMix.value);
                break;

            case 'color-gradient':
                // 创建基本的颜色停止点（如果没有自定义的话）
                const stops = colorGradientStops.value.length > 0 ? colorGradientStops.value : [
                    { offset: 0, color: 0xff0000, alpha: 1 },
                    { offset: 1, color: 0x0000ff, alpha: 1 }
                ];
                newFilter = new ColorGradientFilter({
                    type: colorGradientType.value,
                    stops: stops,
                    angle: colorGradientAngle.value,
                    alpha: colorGradientAlpha.value,
                    maxColors: colorGradientMaxColors.value,
                    replace: colorGradientReplace.value
                });
                break;

            case 'advanced-bloom':
                newFilter = new AdvancedBloomFilter({
                    threshold: advancedBloomThreshold.value,
                    bloomScale: advancedBloomBloomScale.value,
                    brightness: advancedBloomBrightness.value,
                    blur: advancedBloomBlur.value,
                    quality: advancedBloomQuality.value
                });
                break;

            case 'ascii':
                newFilter = new AsciiFilter(asciiSize.value);
                break;

            case 'bevel':
                newFilter = new BevelFilter({
                    rotation: bevelRotation.value,
                    thickness: bevelThickness.value,
                    lightColor: bevelLightColor.value,
                    lightAlpha: bevelLightAlpha.value,
                    shadowColor: bevelShadowColor.value,
                    shadowAlpha: bevelShadowAlpha.value
                });
                break;

            case 'bulge-pinch':
                newFilter = new BulgePinchFilter({
                    center: [bulgePinchCenterX.value, bulgePinchCenterY.value],
                    radius: bulgePinchRadius.value,
                    strength: bulgePinchStrength.value
                });
                break;

            case 'drop-shadow':
                newFilter = new DropShadowFilter({
                    rotation: dropShadowRotation.value,
                    distance: dropShadowDistance.value,
                    color: dropShadowColor.value,
                    alpha: dropShadowAlpha.value,
                    blur: dropShadowBlur.value,
                    quality: dropShadowQuality.value
                });
                break;

            case 'glow':
                newFilter = new GlowFilter({
                    distance: glowDistance.value,
                    outerStrength: glowOuterStrength.value,
                    innerStrength: glowInnerStrength.value,
                    color: glowColor.value,
                    quality: glowQuality.value
                });
                break;

            case 'kawase-blur':
                newFilter = new KawaseBlurFilter(kawaseBlur.value, kawaseQuality.value);
                break;

            case 'outline':
                newFilter = new OutlineFilter(outlineThickness.value, outlineColor.value, outlineQuality.value);
                break;

            case 'pixelate':
                newFilter = new PixelateFilter(pixelateSize.value);
                break;

            case 'radial-blur':
                newFilter = new RadialBlurFilter(
                    radialBlurAngle.value,
                    [radialBlurCenterX.value, radialBlurCenterY.value],
                    radialBlurRadius.value
                );
                break;

            case 'twist':
                newFilter = new TwistFilter({
                    radius: twistRadius.value,
                    angle: twistAngle.value,
                    offset: new PIXI.Point(twistOffsetX.value, twistOffsetY.value)
                });
                break;

            case 'zoom-blur':
                newFilter = new ZoomBlurFilter({
                    strength: zoomBlurStrength.value,
                    center: [zoomBlurCenterX.value, zoomBlurCenterY.value],
                    innerRadius: zoomBlurInnerRadius.value,
                    radius: zoomBlurRadius.value
                });
                break;
        }

        if (newFilter) {
            filters.push(newFilter);
            canvas.viewport.filters = filters;

            // 如果是实时预览，记录当前滤镜
            if (action.realTimePreview) {
                currentPreviewFilter = newFilter;
            }
        }
    }
};

// 设置action回调
actionItem.action = async () => {
    applyEffect();

    // 如果有过渡时间，等待指定时间
    if (duration.value > 0) {
        await new Promise(resolve => setTimeout(resolve, duration.value));
    }
};

// 序列化和反序列化
actionItem.serialize = () => {
    return {
        operationMode: EffectOperaMode[selectedOption.value].value,
        effectType: EffectTypes[selectedEffectType.value].value,
        duration: duration.value,
        parameters: {
            blur: blurValue.value,
            brightness: brightnessValue.value,
            contrast: contrastValue.value,
            saturation: saturationValue.value,
            stippleTransparency: stippleTransparency.value,
            stippleDotSize: stippleDotSize.value,
            bloomBlur: bloomBlur.value,
            bloomQuality: bloomQuality.value,
            bloomKernelSize: bloomKernelSize.value
        }
    };
};

actionItem.deserialize = () => {
    if (actionItem.actionData) {
        const data = actionItem.actionData;

        // 恢复操作模式
        const operationIndex = EffectOperaMode.findIndex(mode => mode.value === data.operationMode);
        if (operationIndex !== -1) {
            selectedOption.value = operationIndex;
        }

        // 恢复特效类型
        const effectIndex = EffectTypes.findIndex(type => type.value === data.effectType);
        if (effectIndex !== -1) {
            selectedEffectType.value = effectIndex;
        }

        // 恢复参数
        if (data.duration !== undefined) duration.value = data.duration;
        if (data.parameters) {
            const params = data.parameters;
            if (params.blur !== undefined) blurValue.value = params.blur;
            if (params.brightness !== undefined) brightnessValue.value = params.brightness;
            if (params.contrast !== undefined) contrastValue.value = params.contrast;
            if (params.saturation !== undefined) saturationValue.value = params.saturation;
            if (params.stippleTransparency !== undefined) stippleTransparency.value = params.stippleTransparency;
            if (params.stippleDotSize !== undefined) stippleDotSize.value = params.stippleDotSize;
            if (params.bloomBlur !== undefined) bloomBlur.value = params.bloomBlur;
            if (params.bloomQuality !== undefined) bloomQuality.value = params.bloomQuality;
            if (params.bloomKernelSize !== undefined) bloomKernelSize.value = params.bloomKernelSize;

            // Adjustment filter parameters
            if (params.adjustmentGamma !== undefined) adjustmentGamma.value = params.adjustmentGamma;
            if (params.adjustmentSaturation !== undefined) adjustmentSaturation.value = params.adjustmentSaturation;
            if (params.adjustmentContrast !== undefined) adjustmentContrast.value = params.adjustmentContrast;
            if (params.adjustmentBrightness !== undefined) adjustmentBrightness.value = params.adjustmentBrightness;
            if (params.adjustmentRed !== undefined) adjustmentRed.value = params.adjustmentRed;
            if (params.adjustmentGreen !== undefined) adjustmentGreen.value = params.adjustmentGreen;
            if (params.adjustmentBlue !== undefined) adjustmentBlue.value = params.adjustmentBlue;
            if (params.adjustmentAlpha !== undefined) adjustmentAlpha.value = params.adjustmentAlpha;

            // Advanced Bloom filter parameters
            if (params.advancedBloomThreshold !== undefined) advancedBloomThreshold.value = params.advancedBloomThreshold;
            if (params.advancedBloomBloomScale !== undefined) advancedBloomBloomScale.value = params.advancedBloomBloomScale;
            if (params.advancedBloomBrightness !== undefined) advancedBloomBrightness.value = params.advancedBloomBrightness;
            if (params.advancedBloomBlur !== undefined) advancedBloomBlur.value = params.advancedBloomBlur;
            if (params.advancedBloomQuality !== undefined) advancedBloomQuality.value = params.advancedBloomQuality;

            // Color Gradient filter parameters
            if (params.colorGradientType !== undefined) colorGradientType.value = params.colorGradientType;
            if (params.colorGradientStops !== undefined) colorGradientStops.value = params.colorGradientStops;
            if (params.colorGradientAngle !== undefined) colorGradientAngle.value = params.colorGradientAngle;
            if (params.colorGradientAlpha !== undefined) colorGradientAlpha.value = params.colorGradientAlpha;
            if (params.colorGradientMaxColors !== undefined) colorGradientMaxColors.value = params.colorGradientMaxColors;
            if (params.colorGradientReplace !== undefined) colorGradientReplace.value = params.colorGradientReplace;

            // Color Map filter parameters
            if (params.colorMapColorSize !== undefined) colorMapColorSize.value = params.colorMapColorSize;
            if (params.colorMapNearest !== undefined) colorMapNearest.value = params.colorMapNearest;
            if (params.colorMapMix !== undefined) colorMapMix.value = params.colorMapMix;

            // Color Overlay filter parameters
            if (params.colorOverlayColor !== undefined) colorOverlayColor.value = params.colorOverlayColor;
            if (params.colorOverlayAlpha !== undefined) colorOverlayAlpha.value = params.colorOverlayAlpha;

            // Color Replace filter parameters
            if (params.colorReplaceOriginalColor !== undefined) colorReplaceOriginalColor.value = params.colorReplaceOriginalColor;
            if (params.colorReplaceNewColor !== undefined) colorReplaceNewColor.value = params.colorReplaceNewColor;
            if (params.colorReplaceEpsilon !== undefined) colorReplaceEpsilon.value = params.colorReplaceEpsilon;

            // Convolution filter parameters
            if (params.convolutionMatrix !== undefined) convolutionMatrix.value = params.convolutionMatrix;
            if (params.convolutionWidth !== undefined) convolutionWidth.value = params.convolutionWidth;
            if (params.convolutionHeight !== undefined) convolutionHeight.value = params.convolutionHeight;

            // CRT filter parameters
            if (params.crtTime !== undefined) crtTime.value = params.crtTime;
            if (params.crtSeed !== undefined) crtSeed.value = params.crtSeed;
            if (params.crtCurvature !== undefined) crtCurvature.value = params.crtCurvature;
            if (params.crtLineWidth !== undefined) crtLineWidth.value = params.crtLineWidth;
            if (params.crtLineContrast !== undefined) crtLineContrast.value = params.crtLineContrast;
            if (params.crtVerticalLine !== undefined) crtVerticalLine.value = params.crtVerticalLine;
            if (params.crtNoise !== undefined) crtNoise.value = params.crtNoise;
            if (params.crtNoiseSize !== undefined) crtNoiseSize.value = params.crtNoiseSize;
            if (params.crtVignetting !== undefined) crtVignetting.value = params.crtVignetting;
            if (params.crtVignettingAlpha !== undefined) crtVignettingAlpha.value = params.crtVignettingAlpha;
            if (params.crtVignettingBlur !== undefined) crtVignettingBlur.value = params.crtVignettingBlur;

            // Dot filter parameters
            if (params.dotScale !== undefined) dotScale.value = params.dotScale;
            if (params.dotAngle !== undefined) dotAngle.value = params.dotAngle;

            // Emboss filter parameters
            if (params.embossStrength !== undefined) embossStrength.value = params.embossStrength;

            // Glitch filter parameters
            if (params.glitchSlices !== undefined) glitchSlices.value = params.glitchSlices;
            if (params.glitchOffset !== undefined) glitchOffset.value = params.glitchOffset;
            if (params.glitchDirection !== undefined) glitchDirection.value = params.glitchDirection;
            if (params.glitchFillMode !== undefined) glitchFillMode.value = params.glitchFillMode;
            if (params.glitchSeed !== undefined) glitchSeed.value = params.glitchSeed;
            if (params.glitchAverage !== undefined) glitchAverage.value = params.glitchAverage;
            if (params.glitchMinSize !== undefined) glitchMinSize.value = params.glitchMinSize;
            if (params.glitchSampleSize !== undefined) glitchSampleSize.value = params.glitchSampleSize;
            if (params.glitchRedX !== undefined) glitchRedX.value = params.glitchRedX;
            if (params.glitchRedY !== undefined) glitchRedY.value = params.glitchRedY;
            if (params.glitchGreenX !== undefined) glitchGreenX.value = params.glitchGreenX;
            if (params.glitchGreenY !== undefined) glitchGreenY.value = params.glitchGreenY;
            if (params.glitchBlueX !== undefined) glitchBlueX.value = params.glitchBlueX;
            if (params.glitchBlueY !== undefined) glitchBlueY.value = params.glitchBlueY;

            // Godray filter parameters
            if (params.godrayAngle !== undefined) godrayAngle.value = params.godrayAngle;
            if (params.godrayGain !== undefined) godrayGain.value = params.godrayGain;
            if (params.godrayLacunarity !== undefined) godrayLacunarity.value = params.godrayLacunarity;
            if (params.godrayParallel !== undefined) godrayParallel.value = params.godrayParallel;
            if (params.godrayTime !== undefined) godrayTime.value = params.godrayTime;
            if (params.godrayCenterX !== undefined) godrayCenterX.value = params.godrayCenterX;
            if (params.godrayCenterY !== undefined) godrayCenterY.value = params.godrayCenterY;
            if (params.godrayAlpha !== undefined) godrayAlpha.value = params.godrayAlpha;

            // HSL Adjustment filter parameters
            if (params.hslHue !== undefined) hslHue.value = params.hslHue;
            if (params.hslSaturation !== undefined) hslSaturation.value = params.hslSaturation;
            if (params.hslLightness !== undefined) hslLightness.value = params.hslLightness;
            if (params.hslColorize !== undefined) hslColorize.value = params.hslColorize;
            if (params.hslAlpha !== undefined) hslAlpha.value = params.hslAlpha;

            // Motion Blur filter parameters
            if (params.motionBlurVelocityX !== undefined) motionBlurVelocityX.value = params.motionBlurVelocityX;
            if (params.motionBlurVelocityY !== undefined) motionBlurVelocityY.value = params.motionBlurVelocityY;
            if (params.motionBlurKernelSize !== undefined) motionBlurKernelSize.value = params.motionBlurKernelSize;
            if (params.motionBlurOffset !== undefined) motionBlurOffset.value = params.motionBlurOffset;

            // Multi Color Replace filter parameters
            if (params.multiColorReplaceTolerance !== undefined) multiColorReplaceTolerance.value = params.multiColorReplaceTolerance;
            if (params.multiColorReplaceMaxColors !== undefined) multiColorReplaceMaxColors.value = params.multiColorReplaceMaxColors;

            // Old Film filter parameters
            if (params.oldFilmSepia !== undefined) oldFilmSepia.value = params.oldFilmSepia;
            if (params.oldFilmNoise !== undefined) oldFilmNoise.value = params.oldFilmNoise;
            if (params.oldFilmNoiseSize !== undefined) oldFilmNoiseSize.value = params.oldFilmNoiseSize;
            if (params.oldFilmScratch !== undefined) oldFilmScratch.value = params.oldFilmScratch;
            if (params.oldFilmScratchDensity !== undefined) oldFilmScratchDensity.value = params.oldFilmScratchDensity;
            if (params.oldFilmScratchWidth !== undefined) oldFilmScratchWidth.value = params.oldFilmScratchWidth;
            if (params.oldFilmVignetting !== undefined) oldFilmVignetting.value = params.oldFilmVignetting;
            if (params.oldFilmVignettingAlpha !== undefined) oldFilmVignettingAlpha.value = params.oldFilmVignettingAlpha;
            if (params.oldFilmVignettingBlur !== undefined) oldFilmVignettingBlur.value = params.oldFilmVignettingBlur;
            if (params.oldFilmSeed !== undefined) oldFilmSeed.value = params.oldFilmSeed;

            // Reflection filter parameters
            if (params.reflectionMirror !== undefined) reflectionMirror.value = params.reflectionMirror;
            if (params.reflectionBoundary !== undefined) reflectionBoundary.value = params.reflectionBoundary;
            if (params.reflectionAmplitude !== undefined) reflectionAmplitude.value = params.reflectionAmplitude;
            if (params.reflectionWaveLength !== undefined) reflectionWaveLength.value = params.reflectionWaveLength;
            if (params.reflectionAlpha !== undefined) reflectionAlpha.value = params.reflectionAlpha;
            if (params.reflectionTime !== undefined) reflectionTime.value = params.reflectionTime;

            // RGB Split filter parameters
            if (params.rgbSplitRed !== undefined) rgbSplitRed.value = params.rgbSplitRed;
            if (params.rgbSplitGreen !== undefined) rgbSplitGreen.value = params.rgbSplitGreen;
            if (params.rgbSplitBlue !== undefined) rgbSplitBlue.value = params.rgbSplitBlue;

            // Shockwave filter parameters
            if (params.shockwaveCenterX !== undefined) shockwaveCenterX.value = params.shockwaveCenterX;
            if (params.shockwaveCenterY !== undefined) shockwaveCenterY.value = params.shockwaveCenterY;
            if (params.shockwaveAmplitude !== undefined) shockwaveAmplitude.value = params.shockwaveAmplitude;
            if (params.shockwaveWavelength !== undefined) shockwaveWavelength.value = params.shockwaveWavelength;
            if (params.shockwaveBrightness !== undefined) shockwaveBrightness.value = params.shockwaveBrightness;
            if (params.shockwaveSpeed !== undefined) shockwaveSpeed.value = params.shockwaveSpeed;
            if (params.shockwaveRadius !== undefined) shockwaveRadius.value = params.shockwaveRadius;
            if (params.shockwaveTime !== undefined) shockwaveTime.value = params.shockwaveTime;

            // Simple Lightmap filter parameters
            if (params.simpleLightmapTexture !== undefined) simpleLightmapTexture.value = params.simpleLightmapTexture;
            if (params.simpleLightmapColor !== undefined) simpleLightmapColor.value = params.simpleLightmapColor;
            if (params.simpleLightmapAlpha !== undefined) simpleLightmapAlpha.value = params.simpleLightmapAlpha;

            // Tilt Shift filter parameters
            if (params.tiltShiftBlur !== undefined) tiltShiftBlur.value = params.tiltShiftBlur;
            if (params.tiltShiftGradientBlur !== undefined) tiltShiftGradientBlur.value = params.tiltShiftGradientBlur;
            if (params.tiltShiftStartX !== undefined) tiltShiftStart.value.x = params.tiltShiftStartX;
            if (params.tiltShiftStartY !== undefined) tiltShiftStart.value.y = params.tiltShiftStartY;
            if (params.tiltShiftEndX !== undefined) tiltShiftEnd.value.x = params.tiltShiftEndX;
            if (params.tiltShiftEndY !== undefined) tiltShiftEnd.value.y = params.tiltShiftEndY;

            // ASCII filter parameters
            if (params.asciiSize !== undefined) asciiSize.value = params.asciiSize;

            // Bevel filter parameters
            if (params.bevelRotation !== undefined) bevelRotation.value = params.bevelRotation;
            if (params.bevelThickness !== undefined) bevelThickness.value = params.bevelThickness;
            if (params.bevelLightColor !== undefined) bevelLightColor.value = params.bevelLightColor;
            if (params.bevelLightAlpha !== undefined) bevelLightAlpha.value = params.bevelLightAlpha;
            if (params.bevelShadowColor !== undefined) bevelShadowColor.value = params.bevelShadowColor;
            if (params.bevelShadowAlpha !== undefined) bevelShadowAlpha.value = params.bevelShadowAlpha;

            // Bulge Pinch filter parameters
            if (params.bulgePinchCenterX !== undefined) bulgePinchCenterX.value = params.bulgePinchCenterX;
            if (params.bulgePinchCenterY !== undefined) bulgePinchCenterY.value = params.bulgePinchCenterY;
            if (params.bulgePinchRadius !== undefined) bulgePinchRadius.value = params.bulgePinchRadius;
            if (params.bulgePinchStrength !== undefined) bulgePinchStrength.value = params.bulgePinchStrength;

            // Drop Shadow filter parameters
            if (params.dropShadowRotation !== undefined) dropShadowRotation.value = params.dropShadowRotation;
            if (params.dropShadowDistance !== undefined) dropShadowDistance.value = params.dropShadowDistance;
            if (params.dropShadowColor !== undefined) dropShadowColor.value = params.dropShadowColor;
            if (params.dropShadowAlpha !== undefined) dropShadowAlpha.value = params.dropShadowAlpha;
            if (params.dropShadowBlur !== undefined) dropShadowBlur.value = params.dropShadowBlur;
            if (params.dropShadowQuality !== undefined) dropShadowQuality.value = params.dropShadowQuality;

            // Glow filter parameters
            if (params.glowDistance !== undefined) glowDistance.value = params.glowDistance;
            if (params.glowOuterStrength !== undefined) glowOuterStrength.value = params.glowOuterStrength;
            if (params.glowInnerStrength !== undefined) glowInnerStrength.value = params.glowInnerStrength;
            if (params.glowColor !== undefined) glowColor.value = params.glowColor;
            if (params.glowQuality !== undefined) glowQuality.value = params.glowQuality;

            // Kawase Blur filter parameters
            if (params.kawaseBlurBlur !== undefined) kawaseBlur.value = params.kawaseBlurBlur;
            if (params.kawaseBlurQuality !== undefined) kawaseQuality.value = params.kawaseBlurQuality;

            // Outline filter parameters
            if (params.outlineThickness !== undefined) outlineThickness.value = params.outlineThickness;
            if (params.outlineColor !== undefined) outlineColor.value = params.outlineColor;
            if (params.outlineQuality !== undefined) outlineQuality.value = params.outlineQuality;

            // Pixelate filter parameters
            if (params.pixelateSize !== undefined) pixelateSize.value = params.pixelateSize;

            // Radial Blur filter parameters
            if (params.radialBlurAngle !== undefined) radialBlurAngle.value = params.radialBlurAngle;
            if (params.radialBlurCenterX !== undefined) radialBlurCenterX.value = params.radialBlurCenterX;
            if (params.radialBlurCenterY !== undefined) radialBlurCenterY.value = params.radialBlurCenterY;
            if (params.radialBlurRadius !== undefined) radialBlurRadius.value = params.radialBlurRadius;

            // Twist filter parameters
            if (params.twistRadius !== undefined) twistRadius.value = params.twistRadius;
            if (params.twistAngle !== undefined) twistAngle.value = params.twistAngle;
            if (params.twistOffsetX !== undefined) twistOffsetX.value = params.twistOffsetX;
            if (params.twistOffsetY !== undefined) twistOffsetY.value = params.twistOffsetY;

            // Zoom Blur filter parameters
            if (params.zoomBlurStrength !== undefined) zoomBlurStrength.value = params.zoomBlurStrength;
            if (params.zoomBlurCenterX !== undefined) zoomBlurCenterX.value = params.zoomBlurCenterX;
            if (params.zoomBlurCenterY !== undefined) zoomBlurCenterY.value = params.zoomBlurCenterY;
            if (params.zoomBlurInnerRadius !== undefined) zoomBlurInnerRadius.value = params.zoomBlurInnerRadius;
            if (params.zoomBlurRadius !== undefined) zoomBlurRadius.value = params.zoomBlurRadius;
        }
    }
};

onMounted(() => {
    // 初始化数据
    updateActionData();

    // 如果有保存的数据，进行反序列化
    if (actionItem.actionData) {
        actionItem.deserialize?.();
    }
});
</script>

<style scoped>
.convolution-matrix {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
    margin: 10px 0;
}

.matrix-cell input {
    width: 100%;
    padding: 5px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 3px;
}
</style>
