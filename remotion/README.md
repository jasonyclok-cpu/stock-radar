# Remotion Video

A standalone [Remotion](https://www.remotion.dev/) project for generating
vertical **9:16 (1080×1920)** videos with React + TypeScript.

It ships with one demo composition, `HelloWorld`, so you can render a video
immediately and use it as a starting point for your own scenes.

## Setup

```bash
cd remotion
npm install
```

## Preview in Remotion Studio

Opens an interactive editor in the browser where you can scrub the timeline
and tweak props live.

```bash
npm run dev
```

## Render a video

Renders the `HelloWorld` composition to `out/video.mp4`.

```bash
npm run render
```

You can override props or pick another composition directly with the CLI:

```bash
npx remotion render HelloWorld out/video.mp4 \
  --props='{"title":"My Title","subtitle":"Made with Remotion","accentColor":"#4f7cff"}'
```

## Render a still (thumbnail)

```bash
npm run still
```

## Project structure

| File | Purpose |
| --- | --- |
| `src/index.ts` | Entry point — registers the root component. |
| `src/Root.tsx` | Declares compositions (id, size, fps, duration, props). |
| `src/HelloWorld.tsx` | The demo composition with animated title/subtitle. |
| `remotion.config.ts` | Render defaults (codec, quality). |

## Format

- Resolution: **1080×1920** (9:16, portrait)
- Frame rate: **30 fps**
- Duration: **6 s** (configurable in `src/Root.tsx`)

Suitable for TikTok, Instagram Reels, YouTube Shorts, and IG Stories.

## Notes

- A system Chrome/Chromium (Chrome Headless Shell) is downloaded automatically
  by Remotion on first render. Rendering requires it.
- To add a new video, create a component, then register it with another
  `<Composition>` in `src/Root.tsx`.

## Rendering in a restricted/CI environment

Remotion downloads its headless browser from `https://remotion.media`. If you
render inside a sandbox with an outbound network allowlist (e.g. Claude Code on
the web), add **`remotion.media`** to the egress allowlist, or point Remotion at
an existing browser:

```bash
# Use an already-installed Chrome/Chromium instead of downloading one.
npx remotion render HelloWorld out/video.mp4 \
  --browser-executable=/path/to/chrome
```

Bundling and type-checking work without a browser; only the render/still step
needs Chrome.
