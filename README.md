# Gym Timer

React Native (Expo) tajmer koji broji vrijeme i svira zvučni "tik":

- **41., 42. i 43. sekundu** svake minute → viši tik (`tick1`)
- **57., 58. i 59. sekundu** svake minute → niži/drukčiji tik (`tick2`)

Uzorak se ponavlja svake minute (npr. 0:41–0:43, 0:57–0:59, 1:41–1:43, 1:57–1:59, ...).

Dva gumba:
- **Restart** — kreće ispočetka (od nule).
- **Pauza / Nastavi / Start** — zaustavlja i nastavlja brojanje.

## Pokretanje

```bash
npm install
npm start
```

Zatim skeniraj QR kod aplikacijom **Expo Go** (Android/iOS) ili pritisni `a` / `i` / `w` za Android / iOS / web.

## Zvukovi

Dva beep zvuka su generirana skriptom i spremljena u `assets/`. Po želji ih
regeneriraj (ili promijeni frekvencije u skripti):

```bash
npm run gen-sounds
```
