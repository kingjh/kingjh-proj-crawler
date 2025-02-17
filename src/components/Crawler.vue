<template>
  <v-card class="pa-4">
    <v-row>
      <v-col cols="6">
        <v-btn
          block
          color="primary"
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
          <v-chip-group column multiple>
            <v-chip
              v-for="keyword in beiAnKeywords"
              :key="keyword.id"
              filter
              outlined
              :color="keyword.requireMW ? 'primary' : 'default'"
              @click="toggleKeyword(keyword)"
            >
              {{ keyword.keyword }}{{ keyword.requireMW ? '+MW' : '' }}
            </v-chip>
          </v-chip-group>
          <v-row>
            <v-col cols="8">
              <v-text-field
                v-model="newBeiAnKeyword"
                label="添加新关键词"
                @keyup.enter="addBeiAnKeyword"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-checkbox
                v-model="newKeywordRequireMW"
                label="需要MW"
              ></v-checkbox>
            </v-col>
          </v-row>
          <v-btn
            color="primary"
            @click="addBeiAnKeyword"
            :disabled="!newBeiAnKeyword"
          >
            添加关键词
          </v-btn>
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
          <v-chip-group column multiple>
            <v-chip
              v-for="keyword in heZhunKeywords"
              :key="keyword"
              filter
              outlined
              @click="toggleHeZhunKeyword(keyword)"
            >
              {{ keyword }}
            </v-chip>
          </v-chip-group>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newHeZhunKeyword"
                label="添加新关键词"
                @keyup.enter="addHeZhunKeyword"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-btn
            color="primary"
            @click="addHeZhunKeyword"
            :disabled="!newHeZhunKeyword"
          >
            添加关键词
          </v-btn>
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
const beiAnKeywords = ref([
  { id: 1, keyword: '独立储能', requireMW: false },
  // { id: 2, keyword: '储能', requireMW: true },
  // { id: 3, keyword: '农光互补', requireMW: true },
  // { id: 4, keyword: '渔光互补', requireMW: true }
])
const heZhunKeywords = ref(['光伏', '风电场', '牵引站', '用户站', '专用站'])
const newBeiAnKeyword = ref('')
const newHeZhunKeyword = ref('')
const newKeywordRequireMW = ref(false)

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
  if (newBeiAnKeyword.value && !beiAnKeywords.value.some(k => k.keyword === newBeiAnKeyword.value)) {
    beiAnKeywords.value.push({
      id: Date.now(), // 使用时间戳作为唯一ID
      keyword: newBeiAnKeyword.value,
      requireMW: newKeywordRequireMW.value
    })
    newBeiAnKeyword.value = ''
    newKeywordRequireMW.value = false
  }
}

const toggleKeyword = (keyword) => {
  if (keyword.keyword !== '独立储能') { // 独立储能不允许切换MW要求
    keyword.requireMW = !keyword.requireMW
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
    console.log(beiAnKeywords.value)
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

const addHeZhunKeyword = () => {
  if (newHeZhunKeyword.value && !heZhunKeywords.value.includes(newHeZhunKeyword.value)) {
    heZhunKeywords.value.push(newHeZhunKeyword.value)
    newHeZhunKeyword.value = ''
  }
}

const toggleHeZhunKeyword = (keyword) => {
  const index = heZhunKeywords.value.indexOf(keyword)
  if (index > -1) {
    heZhunKeywords.value.splice(index, 1)
  } else {
    heZhunKeywords.value.push(keyword)
  }
}
</script> 