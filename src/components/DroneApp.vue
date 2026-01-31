<template>
  <div class="drone-app">
    <canvas ref="canvasRef" />

    <div class="panels">
      <CollisionPanel :collisions="collisions" />
      <SpeedPanel :violations="speedViolations" />
    </div>

    <div class="settings-panel">
      <h3>Paramètres de détection</h3>
      <div class="slider-item">
        <label>Rayon collision (m) : {{ collisionRadius.toFixed(1) }}</label>
        <input
          type="range"
          v-model.number="collisionRadius"
          min="0.5"
          max="35"
          step="0.5"
        />
      </div>
      <div class="slider-item">
        <label>Seuil vitesse max (m/s) : {{ speedThreshold.toFixed(1) }}</label>
        <input
          type="range"
          v-model.number="speedThreshold"
          min="1"
          max="100"
          step="0.5"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CollisionPanel from '@/components/CollisionPanel.vue'
import SpeedPanel from '@/components/SpeedPanel.vue'
import { BasicScene } from '@/DroneApp/BasicScene'

export default defineComponent({
  name: 'DroneApp',
  components: {
    CollisionPanel,
    SpeedPanel
  },
  data() {
    return {
      basicScene: null as BasicScene | null,
      collisions: [] as { time: number; droneIds: number[] }[],
      speedViolations: [] as { time: number; droneId: number; speed: number }[],
      collisionRadius: 2.5,
      speedThreshold: 10
    }
  },
  mounted() {
    const canvas = this.$refs.canvasRef as HTMLCanvasElement
    if (canvas) {
      this.basicScene = new BasicScene(canvas)

      this.basicScene.onFrameUpdate = () => {
        this.collisions = [...this.basicScene!.collisions]
        this.speedViolations = [...this.basicScene!.speedViolations]
      }
    }
  },
  beforeUnmount() {
    if (this.basicScene) {
      this.basicScene.engine.dispose()
    }
  },
  watch: {
    collisionRadius(newVal: number) {
      if (this.basicScene) {
        this.basicScene.collisionRadius = newVal
      }
    },
    speedThreshold(newVal: number) {
      if (this.basicScene) {
        this.basicScene.speedThreshold = newVal
      }
    }
  }
})
</script>

<style scoped>
.drone-app {
  position: relative;
  width: 100vw;
  height: 100vh;
}

canvas {
  width: 100%;
  height: 100%;
}

.panels {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
}

.panels > * {
  pointer-events: auto;
}

/* Panneau sliders */
.settings-panel {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 50, 0.85);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  border: 2px solid #444;
  z-index: 15;
  width: 400px;
  text-align: center;
}

.settings-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.slider-item {
  margin-bottom: 16px;
}

.slider-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.slider-item input[type="range"] {
  width: 100%;
  height: 8px;
  background: #555;
  border-radius: 4px;
  appearance: none;
}

.slider-item input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00ff88;
  border-radius: 50%;
  cursor: pointer;
}
</style>