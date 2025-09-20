<template>
    <div class="action-item-main">
        <RenderType :type="ResType.Image" />
    </div>
</template>

<script setup lang="ts">
import { ResType } from "../../../script/var";
import RenderType from "../RenderType.vue";
</script>
