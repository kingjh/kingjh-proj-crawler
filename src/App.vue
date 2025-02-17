<template>
  <v-app>
    <v-main>
      <v-container>
        <h1 class="text-h4 mb-6">项目信息爬取系统</h1>
        <Crawler />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import Crawler from './components/Crawler.vue'
</script>

<style>
/* 可以添加全局样式 */
</style> 