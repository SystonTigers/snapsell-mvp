# SnapSell Autofill Extension

## Local build

```bash
pnpm --filter snapsell-extension build
```

The build artefacts live in `apps/extension/dist`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose `apps/extension/dist`.
4. Navigate to an eBay listing form (sandbox or production) and the content
   script will autofill the demo payload when the form fields render.
