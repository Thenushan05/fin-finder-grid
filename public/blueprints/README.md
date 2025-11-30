# Blueprints Folder

This folder contains vessel blueprint images used in the Unified Maintenance page.

## Quick Start

1. **Add your blueprint image here** (PNG, JPG, or SVG)
2. **Use the path** `/blueprints/your-image-name.png` when creating vessels
3. **View in app** by selecting vessel and clicking the "Blueprint" tab

## Example Files

Place your blueprint images here:

- `imul-001-engine.png`
- `vessel-deck-layout.jpg`
- `safety-equipment.svg`

## How to Create Blueprints

See the main project files:

- **BLUEPRINT_SETUP_GUIDE.md** - Complete setup instructions
- **SAMPLE_BLUEPRINTS.md** - Ideas and examples
- **sample-blueprint-generator.html** - Generate a sample blueprint

## Testing

After adding an image:

1. Start dev server: `npm run dev`
2. Open: `http://localhost:8081/blueprints/your-image.png`
3. If you see the image, path is correct! ✓
4. Use that path when creating vessels in the app

## Tips

- Keep files under 500KB
- Use descriptive names (lowercase, hyphens)
- Recommended size: 1920x1080px or similar
- Use PNG for diagrams, JPG for photos
