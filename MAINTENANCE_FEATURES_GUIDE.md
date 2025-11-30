# Maintenance Features - Visual Guide

## 🆕 New Features Added

### 1. Smart Part Name Dropdown in Maintenance Logging

**Location:** Overview Tab → "Log Maintenance" Button

**How it works:**

1. Click "Log Maintenance" button
2. See "Part Name" dropdown populated with parts from your existing rules
3. Select a part → System auto-fills automatically!
4. No more typing errors or mismatched names

**Benefits:**

- ✅ No typos in part names
- ✅ Auto-matches with existing rules
- ✅ System field auto-fills based on selected part
- ✅ Consistent naming across all logs

**Example:**

```
You have rules:
- Engine oil (system: engine)
- Fuel filter (system: engine)
- Net inspection (system: nets)

When logging maintenance:
1. Select "Engine oil" from dropdown
2. System auto-fills to "engine" ✓
3. Enter date, technician, notes
4. Submit → Maintenance logged and counter resets!
```

**Visual Flow:**

```
┌────────────────────────────────────────┐
│  Log Maintenance Work                   │
├────────────────────────────────────────┤
│                                         │
│  System: [engine] ← Auto-filled! ✓     │
│                                         │
│  Part Name: [▼ Select from rules]      │
│             ├─ Engine oil (engine)      │
│             ├─ Fuel filter (engine)     │
│             ├─ Net inspection (nets)    │
│             └─ Lifejackets (safety)     │
│                                         │
│  Date: [2025-11-30]                     │
│  Technician: [John Smith]               │
│  Notes: [Changed oil, filter clean]    │
│  Cost: [$150] (optional)                │
│                                         │
│  [Cancel]  [Log Maintenance]            │
└────────────────────────────────────────┘
```

**If no rules exist yet:**

- Dropdown shows: "No rules created yet"
- Falls back to text input
- Reminder: "Create rules first" appears

---

### 2. Enhanced Blueprint Viewer

**Location:** Blueprint Tab

**Features:**

#### A. Multiple System Blueprints

- Shows ALL systems (Engine, Nets, Safety, Electronics)
- Each system displays its own blueprint
- Organized in separate cards

#### B. Click to Enlarge

- Click any blueprint image → Opens full-size in new tab
- Hover effect shows "Click to enlarge"
- Perfect for detailed inspection

#### C. Smart Display

- Auto-fits to screen (max-height: 96 units)
- Maintains aspect ratio
- Dark background for blueprint visibility
- Smooth hover animation (scales to 102%)

#### D. File Path Display

- Shows exact file path below each blueprint
- Easy to verify which image is loaded
- Example: 📁 /blueprints/engine-layout.png

**Visual Layout:**

```
┌──────────────────────────────────────────────────┐
│  Vessel Blueprints                                │
│  View technical diagrams and system layouts       │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ How to Add Blueprints:                    │   │
│  │ 1. Save image to: public/blueprints/      │   │
│  │ 2. Enter path when creating vessel        │   │
│  │ 3. View here automatically                │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ Engine & Propulsion       [Operational]   │   │
│  │ Main engine                                │   │
│  ├───────────────────────────────────────────┤   │
│  │                                            │   │
│  │  [Blueprint Image - Click to Enlarge]     │   │
│  │         ↑ Hover shows hint                 │   │
│  │                                            │   │
│  │  📁 /blueprints/engine-layout.png          │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │ Nets & Gear              [Operational]    │   │
│  │ Fishing gear                               │   │
│  ├───────────────────────────────────────────┤   │
│  │                                            │   │
│  │  [Blueprint Image - Click to Enlarge]     │   │
│  │                                            │   │
│  │  📁 /blueprints/nets-layout.png            │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 📸 How to Create & Add Blueprints

### Method 1: Use Sample Blueprint Generator

**Easiest method!**

1. Open `sample-blueprint-generator.html` in your browser
2. You'll see a pre-made blueprint with:
   - Engine & Propulsion system
   - Nets & Gear
   - Safety Equipment
   - Electronics
   - Fish Storage
   - Maintenance info
3. Right-click → "Save Image As..."
4. Save to: `public/blueprints/sample-vessel.png`
5. When creating vessel, use: `/blueprints/sample-vessel.png`

### Method 2: Screenshot Text Blueprint

From `SAMPLE_BLUEPRINTS.md`, copy the ASCII art:

```
╔════════════════════════════════════════════════════════════╗
║              VESSEL ENGINE ROOM LAYOUT                     ║
║                    IMUL-001                                ║
╠════════════════════════════════════════════════════════════╣
║    [Generator]      [Main Engine]        [Fuel Tank]      ║
║    Oil Filter       Oil Sump             Fuel Filter      ║
╚════════════════════════════════════════════════════════════╝
```

1. Paste into Notepad
2. Take screenshot (Windows + Shift + S)
3. Save as PNG
4. Copy to `public/blueprints/`

### Method 3: Use Free Online Tools

**Canva (Free):**

1. Go to canva.com
2. Search "blueprint template"
3. Customize with your vessel
4. Download as PNG
5. Save to `public/blueprints/`

**Draw.io (Free, no account):**

1. Go to app.diagrams.net
2. Create blank diagram
3. Add shapes for vessel systems
4. Export as PNG
5. Save to `public/blueprints/`

### Method 4: Photo + Labels

1. Take photo of your actual vessel
2. Open in Paint or any editor
3. Add text labels for systems
4. Save as PNG
5. Copy to `public/blueprints/`

---

## 🎯 Complete Workflow Example

### Scenario: First-Time Setup

**Step 1: Create Vessel with Blueprint**

```
1. Click "Add Vessel"
2. Name: IMUL-001
3. Type: Multi-Day Vessel
4. Blueprint URL: /blueprints/imul-001-layout.png
5. Create → Vessel saved!
```

**Step 2: Create Maintenance Rules**

```
1. Click "Add Rule"
2. System: engine
3. Part Name: Engine oil
4. Trigger: hours
5. Interval: 100
6. Warning: 20
7. Create → Rule saved!

Repeat for:
- Fuel filter (300 hours)
- Net inspection (3 trips)
- Lifejackets (180 days)
```

**Step 3: Complete First Trip**

```
1. Go fishing, return to port
2. Overview tab → "Complete Trip"
3. Engine hours used: 8.5
4. Date: Today
5. Log Trip → Counters updated!
```

**Step 4: Check Status**

```
1. Status Tracking tab
2. See: Engine oil - Due in 91.5 hours [🟢 OK]
3. See: Net inspection - Due in 2 trips [🟢 OK]
```

**Step 5: Log Maintenance (using dropdown)**

```
1. Overview tab → "Log Maintenance"
2. Part Name dropdown → Select "Engine oil"
3. System auto-fills to "engine" ✓
4. Date: Today
5. Technician: John Smith
6. Notes: Changed oil, cleaned filter
7. Cost: $150
8. Log → Counter resets to 100 hours!
```

**Step 6: View Blueprint**

```
1. Blueprint tab
2. See engine blueprint
3. Click image → Opens full-size
4. Check maintenance points on diagram
```

---

## 💡 Tips & Best Practices

### Maintenance Logging

- ✅ **Always use dropdown** when available (prevents typos)
- ✅ **System auto-fills** - verify it's correct
- ✅ **Add notes** - future you will thank you
- ✅ **Log immediately** - don't wait, log right after work
- ✅ **Include cost** - track maintenance budget

### Blueprints

- ✅ **One blueprint per system** - separate Engine, Nets, Safety, Electronics
- ✅ **High resolution** - 1920x1080 or larger
- ✅ **Clear labels** - readable at any size
- ✅ **Use dark background** - better visibility
- ✅ **Include key info** - part locations, specs, maintenance points

### Rules Management

- ✅ **Create rules first** - before logging maintenance
- ✅ **Use exact names** - consistent across all rules
- ✅ **Set realistic intervals** - based on manufacturer specs
- ✅ **Review quarterly** - update as needed

---

## 🔧 Troubleshooting

### Part dropdown is empty

**Problem:** No parts shown in dropdown  
**Solution:** Create maintenance rules first in Rules tab

### System doesn't auto-fill

**Problem:** System stays empty after selecting part  
**Solution:** Rule might not have system_id set. Check Rules tab.

### Blueprint not showing

**Problem:** Image doesn't display  
**Solution:**

1. Check file exists: `public/blueprints/your-image.png`
2. Verify path starts with `/blueprints/`
3. Test directly: `http://localhost:8081/blueprints/your-image.png`

### Blueprint is blurry

**Problem:** Image looks pixelated  
**Solution:** Use higher resolution image (min 1920x1080)

### Click to enlarge doesn't work

**Problem:** Clicking image does nothing  
**Solution:** Check browser popup blocker settings

---

## 📊 Feature Comparison

### Before vs After

| Feature          | Old System       | New System             |
| ---------------- | ---------------- | ---------------------- |
| Part name entry  | ❌ Manual typing | ✅ Dropdown from rules |
| System selection | ❌ Manual entry  | ✅ Auto-filled         |
| Typo risk        | ❌ High          | ✅ Zero                |
| Blueprint view   | ❌ Single image  | ✅ All systems         |
| Image zoom       | ❌ No zoom       | ✅ Click to enlarge    |
| File paths       | ❌ Not shown     | ✅ Visible below image |

---

## 🚀 Quick Start Checklist

- [ ] Create vessel with blueprint URL
- [ ] Add blueprint image to `public/blueprints/`
- [ ] Create 3-5 maintenance rules
- [ ] Complete first trip to initialize counters
- [ ] Check Status Tracking tab
- [ ] Log maintenance using dropdown
- [ ] View blueprints in Blueprint tab
- [ ] Click blueprint to see full-size

**You're ready to go!** The smart dropdown and enhanced blueprint viewer make maintenance tracking faster and more accurate.

---

## 📞 Need Help?

See also:

- **UNIFIED_MAINTENANCE_GUIDE.md** - Complete system overview
- **BLUEPRINT_SETUP_GUIDE.md** - Detailed blueprint instructions
- **SAMPLE_BLUEPRINTS.md** - Blueprint examples and templates
- **sample-blueprint-generator.html** - Generate sample blueprint

All features are designed to make your maintenance workflow smooth and error-free! 🎯
