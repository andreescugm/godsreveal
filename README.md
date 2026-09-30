# GOD'S REVEAL

Web de la marca. Dos mundos: **El Cordero** (línea blanca) y **La Espada** (línea oscura).

## Estructura

- `index.html`: el umbral. Se levanta un velo y aparecen las dos puertas.
- `cordero.html`: paz, luz, rebaño. Film holográfico transparente.
- `espada.html`: prueba, fuego, propósito. Cromo y humo.
- `assets/css/`: `base.css` (sistema compartido), `gate.css`, `lamb.css`, `sword.css`.
- `assets/js/site.js`: la luz (puntero/giroscopio), revelado al hacer scroll, atmósfera generativa, formularios.

Web estática, sin build. Para verla en local:

```bash
python3 -m http.server 8787
```

Se despliega tal cual en Vercel, Netlify o GitHub Pages.

## Pendiente

- Fotos reales de producto (buscar `TODO` en los HTML).
- Conectar los formularios de lista a Shopify o Klaviyo (`assets/js/site.js`).
- Tienda: Shopify como backend de pago.
- Verificar cada cita bíblica antes de estamparla.
