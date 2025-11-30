# Sample Blueprint Instructions

## Create a Simple Blueprint Using Text/ASCII Art

If you don't have image editing tools, you can create a simple text-based blueprint and screenshot it:

### Example 1: Engine Room Blueprint (Text)

```
╔════════════════════════════════════════════════════════════╗
║              VESSEL ENGINE ROOM LAYOUT                     ║
║                    IMUL-001                                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║    [Generator]          [Main Engine]        [Fuel Tank]  ║
║        │                     │                    │        ║
║        │                     │                    │        ║
║    Oil Filter           Oil Sump            Fuel Filter   ║
║                                                            ║
║                                                            ║
║    [Cooling Sys]       [Exhaust]          [Electrical]    ║
║        │                   │                    │          ║
║    Radiator           Manifold            Battery Bank    ║
║                                                            ║
║                                                            ║
║    MAINTENANCE POINTS:                                     ║
║    ● Engine Oil: Check every 100 hours                    ║
║    ● Fuel Filter: Replace every 300 hours                 ║
║    ● Cooling System: Inspect every 50 hours               ║
║    ● Generator Oil: Check every 150 hours                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**To use this:**

1. Copy the text above
2. Paste into Notepad or text editor
3. Take a screenshot
4. Save as `engine_blueprint.png`
5. Copy to `public/blueprints/`

### Example 2: Deck Layout Blueprint

```
╔═══════════════════════════════════════════════════════════════╗
║                    DECK LAYOUT - IMUL-001                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   BOW                                                         ║
║   ┌─────────────────────────────────────────────────┐        ║
║   │  [Anchor]      [Chain Locker]    [Rope Storage] │        ║
║   └─────────────────────────────────────────────────┘        ║
║                                                               ║
║   FORWARD DECK                                                ║
║   ┌─────────────────────────────────────────────────┐        ║
║   │                                                  │        ║
║   │   [Net Winch]         [Work Area]               │        ║
║   │                                                  │        ║
║   └─────────────────────────────────────────────────┘        ║
║                                                               ║
║   WHEELHOUSE                                                  ║
║   ┌─────────────────────────────────────────────────┐        ║
║   │  [Navigation]  [Radio]  [Radar]  [Fish Finder]  │        ║
║   └─────────────────────────────────────────────────┘        ║
║                                                               ║
║   AFT DECK                                                    ║
║   ┌─────────────────────────────────────────────────┐        ║
║   │                                                  │        ║
║   │   [Fish Hold]    [Ice Storage]    [Pump Room]   │        ║
║   │                                                  │        ║
║   └─────────────────────────────────────────────────┘        ║
║                                                               ║
║   STERN                                                       ║
║   ┌─────────────────────────────────────────────────┐        ║
║   │    [Engine Room Access]      [Stern Ramp]       │        ║
║   └─────────────────────────────────────────────────┘        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Using Free Online Tools

### Option 1: Canva (Free)

1. Go to https://www.canva.com/
2. Search for "blueprint template" or "floor plan"
3. Customize with your vessel details
4. Download as PNG
5. Save to `public/blueprints/`

### Option 2: Draw.io (Free, No Account Needed)

1. Go to https://app.diagrams.net/
2. Click "Create New Diagram"
3. Choose "Blank Diagram"
4. Use shapes to draw vessel layout:
   - Rectangles for rooms/equipment
   - Lines for connections
   - Text labels for parts
5. File > Export as > PNG
6. Save to `public/blueprints/`

### Option 3: Google Slides (Free)

1. Open Google Slides
2. Create new blank presentation
3. Insert > Shape > Add rectangles for layout
4. Add text labels
5. File > Download > PNG image
6. Save to `public/blueprints/`

## Sample Blueprint Content Ideas

### Minimal Blueprint (Quick Start)

Just list the systems:

```
VESSEL: IMUL-001
TYPE: Multi-Day Fishing Vessel

SYSTEMS:
1. Engine & Propulsion
   - Main engine
   - Generator
   - Fuel system

2. Nets & Gear
   - Net winches
   - Rigging
   - Trawl doors

3. Safety Equipment
   - Lifejackets
   - Fire extinguishers
   - EPIRB

4. Electronics
   - Navigation
   - Communication
   - Fish finders
```

### Detailed Blueprint (Advanced)

Include measurements, specs, and maintenance points:

```
VESSEL ENGINE SYSTEM - IMUL-001

Main Engine: Caterpillar C12
- Power: 450 HP
- Hours: 2,340
- Last Service: Jan 15, 2025

Oil System:
├─ Engine Oil: 15W-40 Marine (28L capacity)
├─ Oil Filter: CAT 1R-0739
└─ Change Interval: Every 100 hours

Fuel System:
├─ Fuel Tank: 3,000L capacity
├─ Primary Filter: CAT 1R-0750
├─ Secondary Filter: CAT 1R-0751
└─ Change Interval: Every 300 hours

Cooling System:
├─ Coolant: Marine Anti-Freeze (45L)
├─ Heat Exchanger: Clean every 500h
└─ Sea Water Pump: Inspect every 250h
```

## Quick Start Steps

1. **Choose a method** (text screenshot, Canva, draw.io, or Google Slides)
2. **Create your blueprint** with basic vessel layout
3. **Export as PNG** (save as `vessel-blueprint.png`)
4. **Create folder**: `public/blueprints/`
5. **Copy file** to `public/blueprints/vessel-blueprint.png`
6. **Test**: Open `http://localhost:8081/blueprints/vessel-blueprint.png` in browser
7. **Use in app**: Enter `/blueprints/vessel-blueprint.png` when creating vessel

## Example File Structure

After setup, your project should look like:

```
fin-finder-grid/
├── public/
│   ├── blueprints/              ← Create this folder
│   │   ├── imul-001-engine.png  ← Your blueprint images
│   │   ├── imul-001-deck.png
│   │   └── sample-vessel.png
│   └── robots.txt
├── src/
└── ...
```

## Testing Your Blueprint

1. Create `public/blueprints/` folder
2. Add test image (any PNG/JPG)
3. Start dev server: `npm run dev`
4. Open browser: `http://localhost:8081/blueprints/your-image.png`
5. If image shows → path is correct ✓
6. Use that path when creating vessel

## Pro Tips

1. **Start simple** - Even a text description works!
2. **Use phone camera** - Photo of hand-drawn sketch
3. **Screenshot diagrams** - From online resources
4. **Label clearly** - Name each system/component
5. **High contrast** - Easy to read on screen

That's it! You now have everything you need to add blueprints to your vessels.
