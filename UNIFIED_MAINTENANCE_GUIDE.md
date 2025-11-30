# Unified Maintenance Page - Complete Guide

## Overview

All vessel maintenance functionality is now in **ONE PAGE** at `/maintenance`:

- ✅ Vessel management (create, view, delete)
- ✅ Maintenance tracking (status, systems, parts)
- ✅ Maintenance rules (create, edit, delete)
- ✅ Blueprint viewer (upload and display vessel diagrams)
- ✅ Trip logging (complete trips, track hours)
- ✅ Maintenance logging (record service work)

## Navigation

**Old System** (removed):

- `/maintenance` - Vessel list
- `/maintenance-tracking` - Separate tracking page

**New System** (unified):

- `/maintenance` - Everything in tabs!

## Page Structure

The Unified Maintenance page has **4 tabs**:

### 1. Overview Tab

**What it does:** Quick stats and action buttons

**Features:**

- Engine hours counter
- Total trips counter
- Last trip date
- "Complete Trip" button (logs trips)
- "Log Maintenance" button (records service)

**Use when:** You want to see quick vessel stats or log a trip/maintenance

### 2. Status Tracking Tab

**What it does:** Shows maintenance status based on rules

**Features:**

- Overall status badge (OK, DUE SOON, OVERDUE)
- System-by-system status cards
- Part-by-part details with countdowns
- Color-coded status indicators

**Use when:** You want to see what maintenance is due

**Example display:**

```
Engine & Propulsion [🟢 OK]
  ├─ Engine oil: Due in 45 hours [🟢 OK]
  ├─ Fuel filter: Due in 180 hours [🟢 OK]
  └─ Oil filter: Due in 15 hours [🟡 DUE SOON]
```

### 3. Maintenance Rules Tab

**What it does:** Define maintenance schedules

**Features:**

- Create new rules
- View all existing rules
- Delete rules
- Edit rules (coming soon)

**Rule format:**

- System (engine, nets, safety, electronics)
- Part name (e.g., "Engine oil")
- Trigger type (hours, days, trips)
- Interval (e.g., every 100 hours)
- Warning before (e.g., 20 hours before due)

**Use when:** You want to teach the system when maintenance is needed

### 4. Blueprint Tab

**What it does:** Display vessel blueprint images

**Features:**

- View full-size blueprint
- Instructions for adding blueprints
- Preview uploaded images

**Use when:** You want to see vessel layout or system diagrams

## How to Use

### Step 1: Create Your First Vessel

1. Click **"Add Vessel"** button (top right)
2. Fill in the form:
   - **Name:** e.g., "IMUL-001" (required)
   - **Type:** Multi-Day Vessel, Single-Day, or Offshore
   - **Blueprint URL:** `/blueprints/your-image.png` (optional)
3. Click **"Create Vessel"**

Your vessel is created with default systems: Engine, Nets, Safety, Electronics

### Step 2: Create Maintenance Rules

1. Click **"Add Rule"** button (top right)
2. Fill in the rule form:
   - **System:** Choose from dropdown
   - **Part Name:** e.g., "Engine oil"
   - **Trigger Type:** hours, days, or trips
   - **Interval:** e.g., 100 (means every 100 hours/days/trips)
   - **Warning Before:** e.g., 20 (warns 20 hours/days/trips before due)
3. Click **"Create Rule"**

**Example rules:**

- Engine oil: Every 100 hours, warn 20 hours before
- Fuel filter: Every 300 hours, warn 30 hours before
- Net inspection: Every 3 trips, warn 1 trip before
- Lifejackets: Every 180 days, warn 14 days before

### Step 3: Complete Trips

1. Select your vessel from dropdown
2. Go to **Overview tab**
3. Click **"Complete Trip"** button
4. Enter:
   - Engine hours used (e.g., 5.5)
   - Trip date
5. Click **"Log Trip"**

**What happens:**

- Engine hours increase by amount entered
- Total trips increment by 1
- System recalculates all maintenance status
- Status updates automatically

### Step 4: Log Maintenance

1. Select your vessel
2. Go to **Overview tab**
3. Click **"Log Maintenance"** button
4. Fill in:
   - System (which system was serviced)
   - Part name (e.g., "Engine oil")
   - Date of service
   - Technician name
   - Notes (what was done)
   - Cost (optional)
5. Click **"Log Maintenance"**

**What happens:**

- Maintenance record saved
- Counters reset for that part
- Status updates to show "Due in X hours" from current time

### Step 5: View Status

1. Select your vessel
2. Go to **Status Tracking tab**
3. See overall status badge
4. Expand systems to see individual parts
5. Check color indicators:
   - 🟢 Green = OK (plenty of time)
   - 🟡 Yellow = DUE SOON (within warning threshold)
   - 🔴 Red = OVERDUE (past due)

### Step 6: Add Blueprints

See **BLUEPRINT_SETUP_GUIDE.md** for complete instructions.

**Quick version:**

1. Create/find a blueprint image (PNG/JPG)
2. Save to `public/blueprints/your-image.png`
3. When creating vessel, enter `/blueprints/your-image.png` in Blueprint URL field
4. View in Blueprint tab

## How the System Works

### The Rules Engine

**You teach the system once:**

```
"Change engine oil every 100 hours, warn me 20 hours before"
```

**System automatically:**

1. Tracks current engine hours
2. Tracks when oil was last changed
3. Calculates: Next change = Last change + 100 hours
4. Warns you when: Current hours > (Next change - 20)
5. Marks overdue when: Current hours > Next change

### Example Calculation

**Rule:** Engine oil every 100 hours, warn 20 before

**Scenario:**

- Last changed at: 50 hours
- Current hours: 120 hours
- Next due at: 50 + 100 = 150 hours
- Remaining: 150 - 120 = 30 hours
- Status: 🟢 OK (more than 20 hours remaining)

**After 10 more hours:**

- Current hours: 130 hours
- Remaining: 150 - 130 = 20 hours
- Status: 🟡 DUE SOON (exactly at warning threshold)

**After 20 more hours:**

- Current hours: 150 hours
- Remaining: 150 - 150 = 0 hours
- Status: 🔴 OVERDUE (past due date)

### Trigger Types

**1. Hours (engine hours):**

- Tracks total engine running time
- Increments when you "Complete Trip"
- Use for: Oil changes, filter replacements, belt checks

**2. Days (calendar days):**

- Tracks days since last service
- Automatic calendar calculation
- Use for: Safety equipment, annual inspections, certifications

**3. Trips (voyage count):**

- Tracks number of fishing trips
- Increments when you "Complete Trip"
- Use for: Net inspections, gear checks, routine checks

## Common Workflows

### Workflow 1: Daily Trip Operation

1. Go fishing → Return to port
2. Open app → Go to Maintenance page
3. Complete Trip → Enter engine hours (e.g., 8.5 hours)
4. Check Status Tracking tab → See if anything due soon
5. If due → Log Maintenance after servicing

### Workflow 2: Scheduled Maintenance

1. Check Status Tracking tab → See what's due
2. Perform maintenance work
3. Overview tab → Click "Log Maintenance"
4. Enter details → Save
5. Status Tracking → Verify counter reset

### Workflow 3: New Vessel Setup

1. Add Vessel → Create with name/type
2. Add Rules → Define all maintenance schedules
3. Add Blueprint → Upload vessel diagram (optional)
4. Complete first trip → Initialize counters
5. System starts tracking automatically

### Workflow 4: Rule Management

1. Go to Rules tab → View existing rules
2. Click "Add Rule" → Create new schedule
3. Or click delete icon → Remove outdated rule
4. Status updates automatically

## Quick Reference

### Keyboard Shortcuts

- Tab switching: Click tab names
- Create vessel: Click "Add Vessel"
- Create rule: Click "Add Rule"

### Status Colors

- 🟢 Green = OK (safe to operate)
- 🟡 Yellow = DUE SOON (schedule maintenance)
- 🔴 Red = OVERDUE (service immediately)

### API Endpoints (for reference)

- POST `/api/v1/maintenance/vessels` - Create vessel
- GET `/api/v1/maintenance-rules/rules` - Get all rules
- POST `/api/v1/maintenance-rules/rules` - Create rule
- POST `/api/v1/maintenance-rules/vessels/{id}/complete-trip` - Log trip
- POST `/api/v1/maintenance-rules/vessels/{id}/logs` - Log maintenance
- GET `/api/v1/maintenance-rules/vessels/{id}/summary` - Get status

## Troubleshooting

**Problem:** "No vessels found"
**Solution:** Click "Add Vessel" to create your first vessel

**Problem:** "No maintenance data"
**Solution:** Create maintenance rules in Rules tab

**Problem:** Status not updating
**Solution:** Complete a trip or log maintenance to refresh calculations

**Problem:** Blueprint not showing
**Solution:** Check file path, must be `/blueprints/filename.png` and file must exist

**Problem:** Can't see vessel systems
**Solution:** Switch to Status Tracking tab to see system details

## Best Practices

1. **Create rules first** before completing trips
2. **Log trips immediately** after returning to port
3. **Log maintenance promptly** when work is done
4. **Check status daily** to stay ahead of maintenance
5. **Use descriptive names** for parts and systems
6. **Set realistic intervals** based on manufacturer specs
7. **Add notes** when logging maintenance for future reference
8. **Use blueprints** to visualize vessel layout

## Next Steps

1. ✅ Create your first vessel
2. ✅ Define maintenance rules
3. ✅ Complete a trip to initialize counters
4. ✅ Check status tracking
5. ✅ Log maintenance when due
6. ⏳ Add blueprints (optional)
7. ⏳ Repeat cycle for ongoing maintenance

## Support Files

- **BLUEPRINT_SETUP_GUIDE.md** - How to add blueprint images
- **SAMPLE_BLUEPRINTS.md** - Blueprint ideas and examples
- **sample-blueprint-generator.html** - Generate sample blueprint
- **public/blueprints/README.md** - Blueprints folder instructions

---

**You're all set!** The unified maintenance page combines everything you need in one place with an intuitive tab-based interface. Start by creating a vessel, then define your rules, and the system will automatically track everything for you.
