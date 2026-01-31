<template>
  <div class="panel collisions">
    <h3>Collisions détectées</h3>
    <div class="scroll-container">
      <ul v-if="collisions.length > 0">
        <li v-for="(item, index) in collisions" :key="index">
          Drones {{ item.droneIds[0] }} ↔ {{ item.droneIds[1] }} à {{ item.time.toFixed(1) }} s
        </li>
      </ul>
      <p v-else>Aucune collision détectée</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CollisionPanel',
  props: {
    collisions: {
      type: Array as () => { time: number; droneIds: number[] }[],
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
  border: 2px solid #ff5555;
  width: 360px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
}

h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.scroll-container {
  max-height: 280px;
  overflow-y: auto;
  font-size: 13px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  margin-bottom: 6px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
}
</style>