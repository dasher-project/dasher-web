# `dasher-js` Migration Assessment

## Bottom line

`dasher-js` feels smoother because it is built around a small, deterministic
engine:

- `DasherModel` owns zoom math, root promotion, and output tracking.
- `DasherView` owns coordinate transforms and render-node collection.
- `DasherRenderer` draws to a single canvas each frame.

`dasher-web` currently mixes:

- predictor calls
- zoom-box tree mutation
- SVG/DOM node creation
- CSS transitions
- control-panel layout
- mobile layout concerns

inside one runtime path.

That difference matters more than the specific predictor.

## What `dasher-js` does better

### 1. Single-pass canvas rendering

`dasher-js` renders the visible tree into one canvas each frame. It avoids:

- per-node DOM churn
- SVG `<g>` transform issues
- CSS transition timing
- Safari SVG rendering differences

This is the main reason it feels fluid.

### 2. Cleaner Dasher-space math

`DasherModel.scheduleOneStep()` uses a direct Dasher-space update derived from
the original algorithm. The model then decides when to:

- promote a child to root
- rebuild/reparent ancestors
- update output from the node under the crosshair

That is much easier to reason about than our current `ControllerPointer` +
`ZoomBox` + `Viewer` interaction.

### 3. Context-based language-model interface

`dasher-js` does not ask a predictor to push weights into an existing palette.
Instead, it uses a small LM contract:

- `createContext()`
- `cloneContext(ctx)`
- `enterToken(ctx, token)`
- `getContinuations(ctx)`

That interface is closer to what the original Dasher engine wants.

### 4. Better separation of engine from UI

The React layer in `dasher-js` is thin. The engine is usable without React.
That makes it straightforward to embed in another UI shell.

## What to migrate into `dasher-web`

### Keep

- current `dasher-web` UI shell
- language selector / message tools / stats / speech / prefs
- current product structure and page embedding model

### Replace or extract

- Replace the SVG renderer with a canvas renderer modeled on `dasher-js`.
- Introduce an engine layer separate from `UserInterface`.
- Move crosshair, root-promotion, and visible-node collection into that engine.
- Let the UI shell own controls and chrome only.

## Predictor implications

There are two realistic paths.

### Path A: keep `@willwade/ppmpredictor`, add a Dasher-engine adapter

Best if we want:

- lexicon support
- next-word prediction
- corpus management
- configurable PPM parameters

Needed change:

- expose or build a context/continuation adapter so the engine asks for
  continuations directly, instead of using the current weight-callback model.

### Path B: port `dasher-js` / DasherCore-style PPM directly into the engine

Best if we want:

- classic Dasher feel first
- tighter control over per-context continuation generation
- simpler engine integration

Tradeoff:

- we would lose some of the higher-level extras already present in
  `@willwade/ppmpredictor` unless we re-add them later.

## Recommendation

Use Path A first.

Build a new engine contract in `dasher-web`, then write an adapter from
`@willwade/ppmpredictor` to:

- create/reset context
- clone context
- enter character/token
- return continuations with probabilities

If that still does not produce the right feel, then swap the adapter
implementation to a more direct PPM model without changing the UI or engine.

## Build-system recommendation

Use Vite as the first build step.

Why:

- minimal configuration
- native ESM dev flow
- resolves `@willwade/ppmpredictor` without the current import-map/vendoring
- good path to bundle the eventual engine split

## Proposed migration phases

### Phase 1

Add Vite and keep the current app running unchanged.

### Phase 2

Create a new engine package/folder inside `dasher-web`, roughly:

- `engine/DasherModel.js`
- `engine/DasherView.js`
- `engine/DasherRenderer.js`
- `engine/adapters/ppmpredictor.js`

### Phase 3

Embed the canvas engine inside the current `UserInterface` layout and keep all
existing controls.

### Phase 4

Reattach:

- auto speed
- stats
- game mode
- speech
- language changes
- learning toggle

against the new engine.

### Phase 5

Delete the old SVG runtime once the new engine reaches parity.

## Practical next move

The highest-value migration is not “copy predictor tweaks.” It is:

1. keep the `dasher-web` UI
2. replace the rendering/runtime core with a canvas engine
3. adapt `@willwade/ppmpredictor` to that engine interface

That gives us the biggest fluidity gain with the smallest product/UI churn.
