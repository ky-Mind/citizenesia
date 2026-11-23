# CITIZENESIA

A small country whose people are its followers: the playable world of the CITIZENESIA reels on Instagram ([@citizenesia.official](https://www.instagram.com/citizenesia.official/)). Two rules, the same as in the videos: **follow = you are one of the people**, and **the most-liked comment = what happens in the next episode**. The village in the game is the village of the latest episode, built from the same 3D source, so it looks exactly like the reels.

## Play

Online: https://citizenesia.hilmykia.workers.dev (admin: https://citizenesia.hilmykia.workers.dev/kymind)

On your computer:

```bash
npm install
npm run dev
```

Open the address Vite prints. `npm run deploy` publishes the game to Cloudflare with the `cf` CLI (`cloudflare.config.ts`) (it also listens on your network, so a phone on the same Wi-Fi can join). The game needs WebGL.

## How it works (v0.3)

1. **Become one of the people.** Pick your account name and a LOOK (drag to turn around your character and walk while you edit). You start at the gapura, "SELAMAT DATANG DI CITIZENESIA", looking into the village.
2. **Walk the village from the reels.** Everything the comments built is there: Pak Presiden at his podium and KURSI RAKYAT 001 (EP 001), the Rumah Makan Rakyat with its open kitchen and menu (EP 002–003), the Wapres chair of @abdulm4jid_ (EP 004–006), the debate stage and the ballot box (EP 005), the Kas Negara hen (EP 007–008), the 5-storey hospital with its doctors from the comments (EP 007–008), the school (EP 009), the RAKYAT board, the warung 24 jam and the bakso cart.
3. **Use what you find.** Talk to Pak Presiden, sit on KURSI RAKYAT 001, order food, hit the gong, check the treasury, get a check-up, visit the school, give a speech, and find work on the jobs stage (10 coins a shift). The ballot box explains how the country works and opens the Instagram account.
4. **Money is KOIN CITIZENESIA**, toy coins. There is no rupiah anywhere in the game.
5. **The world around never ends.** Land and sea are built in chunks around you and dropped behind you, with villages on the neighbouring land. Deep water drowns you and you wake up at the gapura.
6. **Walk into any house.** Every house has a door: the kampung houses, the village houses on the neighbouring land and the houses players buy. Inside, everything can be used: bed, fridge, stove, table, sofa and TV, light switch, and in bigger houses a computer and a bookshelf. The roof is open to the camera and the wall facing it hides, like a doll's house.
7. **Buy a ready-made house and build.** In build mode pick a small (50), medium (120) or big (250) house and tap the ground; blocks cost a coin each. The village itself stays as in the reels: nothing can be built on it.

| | Laptop | Phone |
| --- | --- | --- |
| Move | WASD / arrows (Shift runs) | joystick |
| Look around 360° | drag | drag |
| Zoom | mouse wheel | pinch |
| Jump / swim up | Space | JUMP / UP |
| Use things | E, R, F, G (shown on the buttons) | the yellow buttons |
| Build mode (outside) | B | BUILD |
| Place / remove | click / right-click, X switches tool | tap, PLACE / REMOVE |
| Pick a block | 1–0 | tap a colour |

Progress is saved in the browser (localStorage). The language follows the device (Indonesian or English); the EN/ID button switches it. Phones get no shadows and a shorter view distance, and on phones the village stands still and is merged into a few hundred meshes (from about 3,000) so it stays smooth; computers keep its idle life (flags, steam, the cheering crowd).

## Admin (the presenter)

One device can be the admin's: you play as Pak Presiden from the reels (or as one of the people, any age from 0 to 80), with endless coins and blocks, any size and body colour, walking on the sea, and teleports to the square, the restaurant, the hospital, the school, the treasury and the neighbouring land. "View as a player" switches the powers off.

Open the game once at `/kymind` (for example `http://localhost:5173/kymind`, or the same path on the online address) on any device you want to be the admin's. The ADMIN button then shows at the top, and the address switches back to the main page. Since the game runs on each player's own device, admin powers change only that device's game; shared data (chat, multiplayer) will need a real login on a server.

## World data

`public/data/world.json` holds the numbers from the account: `population` is the follower count (the RAKYAT counter and board), `day` the latest episode, `links.instagram` the account the ballot box opens.

```json
{ "day": 9, "population": 1799, "decree": { "text": "Sekolah dibuka", "author": "rakyat", "likes": 61 }, "links": { "instagram": "https://www.instagram.com/citizenesia.official/" } }
```

## The village

`src/kampung.js` is the world script of the latest episode (`ep009sekolah-id/work/world-src.js` in the series folder), copied with three changes: no renderer of its own, no ground disc (the endless land is the ground), and toy coins instead of rupiah. `src/kampung-data.js` holds that episode's word timings, which the script uses to know what stands built by the end of the episode. To bring in a newer episode, copy its world source the same way.

## Code

- `src/kit.js`: shared materials and sign painting, the same as the video world.
- `src/actors.js`: the people (the same figures as in the reels, grown to any age) with LOOK options.
- `src/kampung.js`, `src/kampung-data.js`: the village of the latest episode.
- `src/negara.js`: the game layer over the village: what you bump into, house doors, the places you can use, Pak Presiden.
- `src/homes.js`: bought houses, every house door, and the inside of a house.
- `src/terrain.js`: the endless land and sea, built in chunks around the player.
- `src/sfx.js`: small sound effects made in the browser.
- `src/build.js`: blocks, aiming and saving.
- `src/i18n.js`: every visible word in Indonesian and English.
- `src/main.js`: player, camera, input, HUD and the game rules.

Add `?debug` to the address to get `window.__cz` for tests.

## Next

- A national flag and app icon designed by viewers in the comments, chosen by vote, with the designer credited.
- Buildings that unlock at follower milestones (Census Office, People's Stadium, Airport, which also opens travel to the neighbouring land).
- The in-app comment box online (a small server that stores comments for the census).
- Players chatting with each other (needs the same server), with admin checks done on the server.
- Ready-made buildings to buy, jobs beyond the eternal internship, and a shared world for several players.
