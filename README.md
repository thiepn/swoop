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

- Hold while descending to pump into the terrain and build launch charge.
- Release on the uphill/ramp to convert that charge into a real jump.
- Release too early for a weak or failed launch; hold too long over the crest and the jump is missed.
- While airborne, hold to dive harder and shape the landing.
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
- Landscape-first fullscreen installable PWA
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

v2.1.0


## Release certification

`tests/gameplay-smoke.mjs` boots the real browser runtime in CI and verifies tap-to-play startup, automatic ball motion, hold/release controls, pause/resume, finite physics, and startup motion in every mode.


## Pass 2 mobile polish

v2.1.0 compresses the pause experience for short landscape phones, adds a portrait rotation guard, improves safe-area HUD placement, hides gameplay HUD outside active runs, and makes Android Back pause gameplay before leaving the app.


## Production install assets

Swoop ships PNG install icons at 192×192 and 512×512, a 512×512 maskable icon, and a 180×180 Apple touch icon in addition to the SVG source artwork.


## Cache isolation

Swoop only removes Cache Storage entries with the `swoop-` prefix, so installing or updating it cannot delete caches belonging to other apps hosted on the same GitHub Pages origin.


## Active gameplay v2

Swoop no longer auto-launches from terrain. Ground movement can continue without input, but clearing terrain and maintaining strong momentum requires pumping descents and timing a release on the uphill. Missing the release window burns stored charge and costs speed.


## Gameplay v2.1

The core timing loop now distinguishes four meaningful outcomes:

- No input: roll only; no automatic jumps and no score.
- Early release: stays grounded, burns part of the stored pump charge, and reports an early mistake.
- Clean crest release: produces committed airtime, with launch quality based on distance to the upcoming crest.
- Hold too long: crossing the final release deadline registers a missed jump and sharply cuts momentum.

The charge indicator now changes as the launch window approaches, with a subtle gold ring in the clean-release sweet spot. Landing grades also have stronger momentum consequences, and low-speed stalls can end competitive runs.
