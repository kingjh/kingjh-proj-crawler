<template>
  <v-card class="pa-4">
    <v-row>
      <v-col cols="6">
        <v-btn
          block
          color="primary"
          :loading="isBeiAnCrawling"
          :disabled="isCrawling"
          @click="showBeiAnDialog"
        >
          {{ beiAnButtonText }}
        </v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn
          block
          color="secondary"
          :loading="isHeZhunCrawling"
          :disabled="isCrawling"
          @click="showHeZhunDialog"
        >
          {{ heZhunButtonText }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- 备案关键词对话框 -->
    <v-dialog v-model="beiAnDialog" max-width="500px">
      <v-card>
        <v-card-title>设置备案信息关键词</v-card-title>
        <v-card-text>
          <v-chip-group v-model="beiAnKeywords" column multiple>
            <v-chip
              v-for="keyword in beiAnKeywords"
              :key="keyword"
              filter
              outlined
            >
              {{ keyword }}
            </v-chip>
          </v-chip-group>
          <v-text-field
            v-model="newBeiAnKeyword"
            label="添加新关键词"
            append-icon="mdi-plus"
            @click:append="addBeiAnKeyword"
            @keyup.enter="addBeiAnKeyword"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="startBeiAnCrawler">
            开始爬取
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 核准关键词对话框 -->
    <v-dialog v-model="heZhunDialog" max-width="500px">
      <v-card>
        <v-card-title>设置核准信息关键词</v-card-title>
        <v-card-text>
          <v-chip-group v-model="heZhunKeywords" column multiple>
            <v-chip
              v-for="keyword in heZhunKeywords"
              :key="keyword"
              filter
              outlined
            >
              {{ keyword }}
            </v-chip>
          </v-chip-group>
          <v-text-field
            v-model="newHeZhunKeyword"
            label="添加新关键词"
            append-icon="mdi-plus"
            @click:append="addHeZhunKeyword"
            @keyup.enter="addHeZhunKeyword"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="startHeZhunCrawler">
            开始爬取
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { crawlBeiAn } from '../services/beiAn'
import { crawlHeZhun } from '../services/heZhun'

// 状态
const beiAnDialog = ref(false)
const heZhunDialog = ref(false)
const isBeiAnCrawling = ref(false)
const isHeZhunCrawling = ref(false)
const timer = ref(null)
const elapsedTime = ref(0)
const beiAnKeywords = ref(['储能'])
const heZhunKeywords = ref(['光伏', '风电场', '牵引站', '用户站', '专用站'])
const newBeiAnKeyword = ref('')
const newHeZhunKeyword = ref('')

// 计算属性
const isCrawling = computed(() => isBeiAnCrawling.value || isHeZhunCrawling.value)
const beiAnButtonText = computed(() => {
  if (!isBeiAnCrawling.value) return '爬取备案信息'
  return `爬取备案信息 (${elapsedTime.value}秒)`
})
const heZhunButtonText = computed(() => {
  if (!isHeZhunCrawling.value) return '爬取核准信息'
  return `爬取核准信息 (${elapsedTime.value}秒)`
})

// 方法
const showBeiAnDialog = () => {
  beiAnDialog.value = true
}

const showHeZhunDialog = () => {
  heZhunDialog.value = true
}

const addBeiAnKeyword = () => {
  if (newBeiAnKeyword.value && !beiAnKeywords.value.includes(newBeiAnKeyword.value)) {
    beiAnKeywords.value.push(newBeiAnKeyword.value)
    newBeiAnKeyword.value = ''
  }
}

const addHeZhunKeyword = () => {
  if (newHeZhunKeyword.value && !heZhunKeywords.value.includes(newHeZhunKeyword.value)) {
    heZhunKeywords.value.push(newHeZhunKeyword.value)
    newHeZhunKeyword.value = ''
  }
}

const startTimer = () => {
  elapsedTime.value = 0
  timer.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const downloadExcel = (data, filename) => {
  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const startBeiAnCrawler = async () => {
  beiAnDialog.value = false
  isBeiAnCrawling.value = true
  startTimer()

  try {
    const result = await crawlBeiAn(beiAnKeywords.value)
    downloadExcel(result, '备案信息.xlsx')
  } catch (error) {
    console.error('备案信息爬取失败:', error)
  } finally {
    isBeiAnCrawling.value = false
    stopTimer()
  }
}

const startHeZhunCrawler = async () => {
  heZhunDialog.value = false
  isHeZhunCrawling.value = true
  startTimer()

  try {
    const result = await crawlHeZhun(heZhunKeywords.value)
    downloadExcel(result, '核准信息.xlsx')
  } catch (error) {
    console.error('核准信息爬取失败:', error)
  } finally {
    isHeZhunCrawling.value = false
    stopTimer()
  }
}
</script> 