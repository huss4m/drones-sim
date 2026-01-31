# Logiciel de visualisation de chorégraphie de drones  
**M2 GIG - Animation – Rendu 31/01/2026**

Développé en **JavaScript / WebGL** avec **Babylon.js** et **Vue.js** (pour l'interface de contrôle et les panneaux de logs).

Ce projet permet de charger un fichier JSON de waypoints, d'afficher et d'animer un ensemble de drones 3D, avec détection de collisions et vitesses excessives, timeline interactive, et repères visuels toggleables.

## Touches de contrôle

| Touche | Action | Description |
|------|-------|------------|
| **Espace** | Play / Pause | Lance ou met en pause l’animation des drones |
| **R** | Reset | Remet tout à *t = 0* (positions des drones, timeline, logs collisions/vitesses, états) |
| **T** | Toggle trajectoires | Affiche/masque les lignes reliant les waypoints + sphères aux points |
| **H** | Toggle grilles | Affiche/masque les grilles (sol horizontal + plans verticaux YZ/XZ) |
| **A** | Toggle axes | Affiche/masque les axes 3D (X rouge, Y vert, Z bleu) – cachés par défaut |
| **N** | Toggle noms des drones | Affiche/masque les labels texte "Drone X" au-dessus de chaque drone |
| **V** | Toggle lignes verticales | Affiche/masque les lignes reliant chaque drone au sol (Y=0) |
| **Souris + ZQSD / Flèches** | Caméra libre | Déplacement + rotation libre (FreeCamera) |


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
