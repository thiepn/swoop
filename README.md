# Swoop

**Dive. Fly. Flow.**

Swoop is a small mobile-first momentum arcade game built for short, low-pressure sessions. Hold to dive, release to carry momentum off a crest, then meet the next slope smoothly.

## Play

GitHub Pages requires one initial repository setting because the connected integration cannot enable Pages itself. In **Settings → Pages**, choose **GitHub Actions** as the source, then re-run the existing `Deploy Swoop to Pages` workflow.

After that, the app is designed to run at:

**https://thiepn.github.io/swoop/**

It is installable as a PWA and works offline after the first successful load.

## Modes

- **Classic** — score-chasing runs; severe crashes end the run.
- **Chill** — identical core controls, no game over.
- **Zen** — Chill-style play with the performance HUD removed.
- **Speed** — higher velocity with wider terrain and faster pacing.
- **Low-G** — longer airborne arcs and larger-scale terrain.
- **Daily** — a deterministic local daily seed with unlimited attempts.

## Core rules

- Hold while airborne to dive harder.
- Hold through descents to press into the terrain and build speed.
- Release near a crest to launch naturally.
- Smooth and perfect landings preserve momentum and build Flow.
- Cross higher altitude gates for more pending score, then land to bank it.
- No currency, upgrades, lives, energy, quests, streaks, ads, or locked gameplay.

## Technical design

- Dependency-free HTML5 Canvas
- Fixed 120 Hz physics simulation with refresh-rate-independent rendering
- Seeded procedural terrain
- Terrain roles: flow, speed, launch, challenge, recovery, spectacle
- Local-only persistence
- Web Audio effects and speed-reactive wind
- Optional vibration/haptics
- Six visual themes
- Offline service worker
- Portrait-first installable PWA
- No backend and no runtime network dependency

## Development

There is no build step. Serve the repository root over HTTP(S), or use GitHub Pages.

For desktop testing:

- **Space** — hold/release
- **R** — restart
- **Escape** — pause/resume

The runtime also exposes a tiny debugging handle:

    window.SWOOP.version
    window.SWOOP.seed
    window.SWOOP.state
    window.SWOOP.restartSeed(12345)

## Version

v1.1.0
