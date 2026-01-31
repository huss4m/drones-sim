<template>
  <div class="panel speeds">
    <h3>Vitesses excessives</h3>
    <div class="scroll-container">
      <ul v-if="violations.length > 0">
        <li v-for="(item, index) in violations" :key="index">
          Drone {{ item.droneId }} à {{ item.time.toFixed(1) }} s : {{ item.speed.toFixed(1) }} m/s
        </li>
      </ul>
      <p v-else>Aucune vitesse excessive détectée</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SpeedPanel',
  props: {
    violations: {
      type: Array as () => { time: number; droneId: number; speed: number }[],
      default: () => []
    }
  }
})
</script>

<style scoped>
.panel {
  background: rgba(30, 30, 50, 0.9);
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #ffaa00;
  width: 360px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
}

h3 { margin: 0 0 10px 0; font-size: 16px; }
.scroll-container { max-height: 280px; overflow-y: auto; font-size: 13px; }
ul { list-style: none; margin: 0; padding: 0; }
li { margin-bottom: 6px; padding: 6px 10px; background: rgba(255,255,255,0.08); border-radius: 4px; }
</style>