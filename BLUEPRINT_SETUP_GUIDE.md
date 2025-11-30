# Blueprint Setup Guide

## Overview

The Unified Maintenance page supports displaying vessel blueprints with interactive features. This guide explains how to add blueprint images to your vessels.

## Quick Start

### 1. Prepare Your Blueprint Image

- **Supported formats:** PNG, JPG, JPEG, SVG
- **Recommended size:** 1920x1080px or similar high-resolution
- **Content:** Technical diagram showing vessel systems, engine layout, deck plan, etc.

### 2. Add Image to Project

**Step 1:** Create the blueprints folder

```bash
mkdir public/blueprints
```

**Step 2:** Copy your blueprint image

```bash
# Example: Copy your blueprint file
copy vessel_engine_blueprint.png public/blueprints/
```

### 3. Add Blueprint When Creating Vessel

When creating a new vessel in the UI:

1. Click "Add Vessel" button
2. Fill in vessel name and type
3. In the "Blueprint Image URL" field, enter: `/blueprints/your-image-name.png`
4. Preview will show automatically if path is correct
5. Click "Create Vessel"

**Example paths:**

- `/blueprints/engine_blueprint.png`
- `/blueprints/imul-001-deck.jpg`
- `/blueprints/vessel_schematic.svg`

## Blueprint Ideas

### For Different Vessel Types

**1. Multi-Day Vessel Blueprint:**

- Engine room layout
- Fuel tank locations
- Refrigeration system
- Generator placement
- Deck equipment

**2. Single-Day Vessel Blueprint:**

- Engine specifications
- Net storage areas
- Safety equipment locations
- Electronics placement

**3. Offshore Vessel Blueprint:**

- Complete deck plan
- Navigation equipment
- Communication systems
- Safety zones

## Where to Get Blueprint Images

### Option 1: Create Your Own

- Use **draw.io** (free): https://app.diagrams.net/
- Use **Canva** (free templates): https://www.canva.com/
- Use **Inkscape** (free vector): https://inkscape.org/

### Option 2: Use Stock Technical Diagrams

- Search "fishing vessel blueprint" on image sites
- Look for "boat schematic diagram"
- Find "marine engine layout"

### Option 3: Take Photos & Annotate

- Take photo of actual vessel
- Use image editor to add labels
- Highlight key maintenance areas
- Save as PNG/JPG

## Example Blueprint Structure

```
public/
  blueprints/
    ├── imul-001-engine.png       (Engine system diagram)
    ├── imul-001-deck.png         (Deck layout)
    ├── iday-002-schematic.jpg    (Full vessel schematic)
    ├── nets-rigging.svg          (Net and rigging diagram)
    └── safety-equipment.png      (Safety equipment locations)
```

## Viewing Blueprints

Once added, blueprints appear in the **Blueprint tab** of the Unified Maintenance page:

1. Select your vessel from dropdown
2. Click "Blueprint" tab
3. View full-size blueprint image
4. Future: Click on hotspots for system details

## Advanced: Interactive Hotspots (Future Feature)

The system supports clickable hotspot coordinates for interactive blueprints:

```typescript
// In vessel systems array
systems: [
  {
    id: "engine",
    name: "Engine & Propulsion",
    blueprintImage: "/blueprints/engine.png",
    subParts: [
      {
        name: "Oil Filter",
        x: 120, // X coordinate on image
        y: 340, // Y coordinate on image
        status: "operational",
      },
    ],
  },
];
```

## Troubleshooting

**Blueprint doesn't show:**

- Check file path is correct (case-sensitive)
- Verify file is in `public/blueprints/` folder
- Check file extension matches (.png, .jpg, etc.)
- Try opening image directly: `http://localhost:8081/blueprints/your-image.png`

**Image is too large:**

- Resize to max 2000x2000px before adding
- Use online tool: https://www.iloveimg.com/resize-image
- Compress PNG: https://tinypng.com/

**Wrong aspect ratio:**

- Blueprint displays with `object-contain` (maintains aspect ratio)
- Recommended: Use landscape orientation (16:9 or 4:3)

## Best Practices

1. **Naming Convention:**

   - Use lowercase
   - Use hyphens, not spaces
   - Include vessel ID: `imul-001-engine.png`

2. **File Organization:**

   - Group by vessel: `/blueprints/imul-001/`
   - Or by system: `/blueprints/engines/`

3. **File Size:**

   - Keep under 500KB per image
   - Use PNG for diagrams
   - Use JPG for photos

4. **Accessibility:**
   - Add descriptive filenames
   - Use high contrast for readability
   - Label key components clearly

## Quick Examples

### Example 1: Simple Engine Blueprint

1. Download free engine diagram from internet
2. Save as `engine-simple.png`
3. Copy to `public/blueprints/`
4. Enter `/blueprints/engine-simple.png` when creating vessel

### Example 2: Custom Vessel Layout

1. Open draw.io (https://app.diagrams.net/)
2. Draw vessel outline, add systems
3. Export as PNG (File > Export as > PNG)
4. Save to `public/blueprints/my-vessel-layout.png`
5. Use path `/blueprints/my-vessel-layout.png`

### Example 3: Multiple Blueprints per Vessel

Create separate blueprints for each system:

- `/blueprints/imul-001-engine.png`
- `/blueprints/imul-001-nets.png`
- `/blueprints/imul-001-safety.png`
- `/blueprints/imul-001-electronics.png`

Then edit vessel systems to use different images per system (requires database update or vessel edit feature).

## Next Steps

1. Create your first blueprint image
2. Add to `public/blueprints/` folder
3. Create new vessel with blueprint path
4. Navigate to Blueprint tab to view
5. Add more blueprints as needed

---

**Need Help?** Check that:

- File exists in `public/blueprints/`
- Path starts with `/blueprints/`
- File extension is correct
- No typos in filename
