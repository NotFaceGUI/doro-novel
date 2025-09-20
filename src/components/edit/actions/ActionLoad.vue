<template>
    <div class="action-load">
        <div class="name">{{ load?.name }}</div>
        <div class="type">
            <RenderType :type="load!.type" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { LoadRes } from "../../../types/app";
import RenderType from "../RenderType.vue";

defineProps<{ load?: LoadRes }>();
</script>
