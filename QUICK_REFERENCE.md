# Quick Reference Card - Maintenance System

## 🎯 At a Glance

### Smart Maintenance Logging

```
┌─────────────────────────────────────┐
│ Log Maintenance                     │
├─────────────────────────────────────┤
│ Part: [▼ Engine oil (engine)]  ←───┐
│       [▼ Fuel filter (engine)]     │
│       [▼ Net inspection (nets)]    │← From your rules!
│                                     │
│ System: [engine] ← Auto-filled! ✓  │
│                                     │
│ Date: [Today]                       │
│ Tech: [Your name]                   │
│ Notes: [What you did]               │
└─────────────────────────────────────┘
```

### Blueprint Display

```
┌─────────────────────────────────────┐
│ Engine Blueprint                    │
│ ┌─────────────────────────────┐    │
│ │                              │    │
│ │   [Click to enlarge] ───────┼────┐
│ │                              │    │
│ └─────────────────────────────┘    │← Opens full-size
│ 📁 /blueprints/engine.png           │
└─────────────────────────────────────┘
```

## 🔄 Quick Workflows

### Daily Trip

```
1. Complete Trip → Enter hours (8.5h)
2. Check Status → See what's due
3. If due soon → Log Maintenance
```

### Log Maintenance

```
1. Click "Log Maintenance"
2. Select part from dropdown ✓
3. System auto-fills ✓
4. Add notes
5. Submit → Counter resets!
```

### View Blueprints

```
1. Blueprint tab
2. See all systems
3. Click image → Full-size
4. Check maintenance points
```

## 📝 Key Features

✅ **Dropdown prevents typos** - Select from existing rules  
✅ **System auto-fills** - No manual entry needed  
✅ **All systems shown** - Engine, Nets, Safety, Electronics  
✅ **Click to zoom** - View blueprints full-size  
✅ **File paths visible** - Know which image is loaded

## 🎨 Add Blueprints

```bash
# 1. Save image here:
public/blueprints/your-image.png

# 2. When creating vessel, use:
/blueprints/your-image.png

# 3. View in Blueprint tab!
```

## 💡 Pro Tips

**Maintenance Logging:**

- Always use dropdown (no typos!)
- Verify auto-filled system
- Add detailed notes
- Log immediately after work

**Blueprints:**

- One per system is best
- Use 1920x1080 or larger
- Click images to zoom
- Test path in browser first

**Rules:**

- Create rules BEFORE logging
- Use exact, consistent names
- Match part names in dropdown
- Review rules monthly

## 🐛 Troubleshooting

| Problem           | Solution                          |
| ----------------- | --------------------------------- |
| Empty dropdown    | Create rules first                |
| No auto-fill      | Check rule has system_id          |
| Blueprint missing | Verify file in public/blueprints/ |
| Can't zoom        | Check popup blocker               |

## 📚 Full Docs

- **MAINTENANCE_FEATURES_GUIDE.md** - Visual guide
- **UNIFIED_MAINTENANCE_GUIDE.md** - Complete system
- **BLUEPRINT_SETUP_GUIDE.md** - Blueprint help
- **sample-blueprint-generator.html** - Generate sample

---

**Remember:** Smart dropdown = No typos! 🎯
