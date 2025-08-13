<template>
  <canvas ref="canvas" class="visualizer"></canvas>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  audio: { type: Object, default: null }
})

const canvas = ref(null)
let scene, camera, renderer, analyser, dataArray, bars = []
let audioCtx

function initThree() {
  const width = canvas.value.clientWidth
  const height = canvas.value.clientHeight
  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
  renderer.setSize(width, height)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 50

  const light = new THREE.PointLight(0xffffff, 1)
  light.position.set(10, 10, 10)
  scene.add(light)

  const barCount = 32
  const barWidth = 1
  for (let i = 0; i < barCount; i++) {
    const geometry = new THREE.BoxGeometry(barWidth, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x42b983 })
    const bar = new THREE.Mesh(geometry, material)
    bar.position.x = (i - barCount / 2) * (barWidth + 0.5)
    scene.add(bar)
    bars.push(bar)
  }
}

function initAudio() {
  if (!props.audio) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const source = audioCtx.createMediaElementSource(props.audio)
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 64
  dataArray = new Uint8Array(analyser.frequencyBinCount)
  source.connect(analyser)
  analyser.connect(audioCtx.destination)
}

function animate() {
  requestAnimationFrame(animate)
  if (analyser) {
    analyser.getByteFrequencyData(dataArray)
    bars.forEach((bar, i) => {
      const scale = dataArray[i] / 255 * 20 || 1
      bar.scale.y = Math.max(scale, 1)
      bar.material.color.setHSL(dataArray[i] / 255, 0.6, 0.5)
    })
  }
  renderer.render(scene, camera)
}

function setup() {
  if (!canvas.value || !props.audio) return
  initThree()
  initAudio()
  animate()
}

onMounted(() => {
  watch(
    () => props.audio,
    (audio) => {
      if (audio) {
        audio.addEventListener('play', () => audioCtx && audioCtx.resume())
        setup()
      }
    },
    { immediate: true }
  )
})
</script>

<style scoped>
.visualizer {
  width: 100%;
  height: 200px;
  display: block;
  margin: 1rem auto;
}
</style>

