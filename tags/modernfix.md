---
title: Fixing modernfix compatibility issue
color: Pink
aliases: ['modernfixcompat']
---

If your game is crashing due to incompatibility between Steam 'n' Rails:
1. Navigate to the config folder of your game instance
2. Find file "modernfix-mixins.properties"
3. Add "mixin.perf.datapack_reload_exceptions=false" into the file on its own line
4. Save and relaunch