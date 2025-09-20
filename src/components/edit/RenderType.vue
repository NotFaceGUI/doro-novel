<template>
    <span v-if="type == ResType.Audio">🔊</span>
    <span v-else-if="type == ResType.Video">🎥</span>
    <span v-else-if="type == ResType.Image">🖼️</span>
    <span v-else-if="type == ResType.Spine">🕵️‍♂️</span>
    <span v-else>📄</span>
</template>

<script setup lang="ts">
import { ResType } from '../../script/var';

defineProps<{
    type: ResType
}>()
</script>

