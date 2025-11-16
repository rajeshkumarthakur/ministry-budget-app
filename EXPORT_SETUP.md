# Export & Running Totals Setup Guide

## 🎯 What You're Adding

Two powerful new features:
1. ✅ **PDF & Word Export** - Professional printable reports
2. ✅ **Running Budget Totals** - Cumulative budget tracking

---

## 📦 Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd server
npm install pdfkit docx
```

**What these do:**
- `pdfkit` - Generates professional PDF documents
- `docx` - Creates Microsoft Word documents

### Step 2: Place Backend File

Copy the backend route file:
- `export-routes.js` → `server/routes/export.js`

### Step 3: Register Backend Route

Open `server/server.js` and add:

```javascript
// Add with other route imports
const exportRoutes = require('./routes/export');

// Register route (add with other app.use statements)
app.use('/api/forms', exportRoutes);
```

### Step 4: Place Frontend Files

Copy these files to your project:

```
client/src/
├── components/
│   └── Forms/
│       ├── FormExport.jsx           (NEW - export button component)
│       └── sections/
│           └── FormSection7.jsx     (REPLACE - updated with running totals)
```

### Step 5: Update FormView Component

Open `client/src/components/Forms/FormView.jsx` and:

1. Add import at the top:
```javascript
import FormExport from './FormExport';
```

2. Add the export component after the header section (around line 120):
```jsx
{/* Export Section */}
<FormExport 
  formId={id}
  formNumber={form.form_number}
  ministryName={form.ministry_name}
  status={form.status}
/>
```

See `FormView-Update.jsx` for exact placement.

### Step 6: Restart Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

---

## 🧪 Testing the Features

### Test 1: Export PDF

1. Login and navigate to any form
2. Click "View" to open FormView
3. You should see an "Export Form" section
4. Click "Export PDF" button
5. PDF should download automatically
6. Open PDF and verify:
   - ✓ Form status in top right
   - ✓ All sections included
   - ✓ Events table with running totals
   - ✓ Goals formatted nicely
   - ✓ Budget summary at top and bottom
   - ✓ Professional layout

### Test 2: Export Word

1. From same form view
2. Click "Export Word" button
3. DOCX file should download
4. Open in Microsoft Word
5. Verify:
   - ✓ Editable document
   - ✓ All content present
   - ✓ Tables formatted correctly
   - ✓ Running totals shown

### Test 3: Running Totals in Form Builder

1. Create or edit a form
2. Navigate to Section 4 (Events)
3. Add 3 events with budgets:
   - Event 1: $500
   - Event 2: $750
   - Event 3: $1,000
4. Navigate to Section 7 (Budget Summary)
5. Verify events table shows:
   - Event 1: $500 | Running: $500
   - Event 2: $750 | Running: $1,250
   - Event 3: $1,000 | Running: $2,250
6. Total Events Budget: $2,250

### Test 4: Running Totals in Exports

1. Export the form as PDF
2. Check Events section
3. Verify running total column shows cumulative amounts
4. Repeat for Word export

---

## 📄 PDF Format Details

### Document Structure:

**Page 1: Cover & Budget Summary**
- Church name (header)
- Form title
- Status badge (top right, color-coded)
- Form details (number, ministry, date)
- TOTAL BUDGET (large, highlighted box)
- Budget breakdown (events + operating + capital)

**Page 2+: Form Sections**
- Section 1: Ministry Information
- Section 2: Mission & Vision
- Section 3: Programs (if filled)
- Section 4: Events (with table)
- Section 5: Goals (SMART format)
- Section 6: Resources (if filled)
- Section 7: Budget Summary
- Section 8: Challenges (if filled)
- Section 9: Additional Info (if filled)

**Events Table Format:**
```
Event Name    | Date       | Type      | Attendees | Budget  | Running Total
--------------------------------------------------------------------------
Easter Svc    | 04/09/2025 | Worship   | 200       | $500    | $500
VBS Week      | 06/15/2025 | Outreach  | 150       | $750    | $1,250
Christmas     | 12/25/2025 | Worship   | 300       | $1,000  | $2,250
--------------------------------------------------------------------------
                                          TOTAL:     $2,250
```

**Goals Format:**
```
Goal 1: Increase youth attendance by 25%

Specific: Focus on high school students through Friday night events
Measurable: Track weekly attendance numbers, goal is 50 students
Achievable: Have volunteer team and space available
Relevant: Aligns with church growth goals for next generation
Time-bound: Achieve by December 31, 2025
```

---

## 📊 Running Totals Feature

### What It Does:
Shows cumulative budget as events are added chronologically.

### Example:
```
Event 1: $500   → Running Total: $500
Event 2: $300   → Running Total: $800
Event 3: $200   → Running Total: $1,000
Event 4: $500   → Running Total: $1,500
```

### Where It Shows:
1. **Form Builder** (Section 7)
   - Events table with running total column
   - Real-time calculation
   - Info tooltip explaining the feature

2. **PDF Export**
   - Events section has running total column
   - Professional table formatting
   - Clearly labeled

3. **Word Export**
   - Same table structure as PDF
   - Editable in Word
   - Maintains formatting

### Why It's Useful:
- Shows budget accumulation over time
- Helps identify high-cost events
- Useful for board presentations
- Makes budget discussions clearer
- Shows spending progression

---

## 🎨 Styling & Colors

### Status Colors in PDF:
- **Approved**: Green (#10b981)
- **Rejected**: Red (#ef4444)  
- **Pending**: Yellow/Orange (#f59e0b)
- **Draft**: Gray (#6b7280)

### Budget Highlight Box (PDF):
- Background: Light blue (#eff6ff)
- Border: Blue (#3b82f6)
- Text: Dark blue (#1e40af)
- Large font for total amount

### Running Total Column:
- Font: Bold
- Color: Blue (#3b82f6) - stands out
- Alignment: Right-aligned

---

## 🔍 Troubleshooting

### Issue: "Cannot find module 'pdfkit'"

**Solution:**
```bash
cd server
npm install pdfkit docx
npm run dev
```

### Issue: Export button doesn't appear

**Solution:**
1. Check FormExport.jsx is in correct location
2. Verify import in FormView.jsx
3. Check browser console for errors
4. Restart frontend: `npm run dev`

### Issue: PDF generates but is blank

**Solution:**
1. Check backend console for errors
2. Verify form has data in database
3. Test with: `curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/forms/1/export/pdf > test.pdf`
4. Check database sections field has data

### Issue: Running totals not showing

**Solution:**
1. Verify FormSection7 was replaced with updated version
2. Clear browser cache
3. Check events exist in Section 4
4. Navigate to Section 7 to see running totals
5. Check browser console for errors

### Issue: "Error generating PDF" message

**Solution:**
1. Check backend logs for detailed error
2. Verify database tables exist
3. Ensure form has all required fields
4. Test simpler form first (fewer events/goals)

### Issue: Word document won't open

**Solution:**
1. Verify docx package installed: `npm list docx`
2. Check file downloads completely
3. Try different word processor (LibreOffice, Google Docs)
4. Check backend console for generation errors

---

## 📊 Database Requirements

No changes needed! The export uses existing data:

**Tables Used:**
- `forms` - Main form data
- `ministries` - Ministry name
- `users` - Creator name
- `events` - Events list
- `goals` - Goals list

**Fields Required:**
- All standard form fields
- Events: event_name, event_date, event_type, budget_amount
- Goals: All SMART fields
- Sections: JSON field with all section data

---

## 🎯 Features Included

### PDF Export:
- ✅ Professional layout
- ✅ Church branding ready
- ✅ Status badge (color-coded)
- ✅ All 9 sections
- ✅ Events table with running totals
- ✅ Goals in SMART format
- ✅ Budget summary highlighted
- ✅ Page numbers
- ✅ Footer with timestamp
- ✅ Print-ready formatting

### Word Export:
- ✅ Editable document
- ✅ Tables properly formatted
- ✅ Running totals included
- ✅ All sections
- ✅ Professional styling
- ✅ Compatible with Word 2016+
- ✅ Can add comments/notes
- ✅ Can adjust formatting

### Running Totals:
- ✅ Real-time calculation
- ✅ Shows in Section 7
- ✅ Included in exports
- ✅ Easy to understand
- ✅ Helpful tooltip
- ✅ Color-coded display
- ✅ Right-aligned numbers

---

## 💡 Usage Tips

### For Ministry Leaders:
1. Complete your form as normal
2. Before submitting, export as PDF to review
3. Print PDF for team meeting
4. Export as Word to share draft with team
5. Team can comment in Word doc
6. Make changes, then submit

### For Pillars/Pastors:
1. Review form online first
2. Export as PDF for detailed review
3. Print for board meeting
4. Share Word version for discussion
5. Use running totals to discuss budget flow
6. Approve/reject with comments

### For Admins:
1. Export all approved forms as PDFs
2. Create annual report binder
3. Share Word versions for record-keeping
4. Use for budget presentations
5. Archive in Google Drive/SharePoint

---

## 🎊 Success Checklist

Before considering this complete, verify:

**Backend:**
- [ ] pdfkit and docx packages installed
- [ ] export.js route file in place
- [ ] Route registered in server.js
- [ ] Backend starts without errors
- [ ] Can access export endpoints

**Frontend:**
- [ ] FormExport.jsx component added
- [ ] FormSection7 replaced with updated version
- [ ] FormView updated with export button
- [ ] Frontend starts without errors
- [ ] Export section visible in form view

**PDF Export:**
- [ ] PDF downloads when clicked
- [ ] Opens in PDF viewer
- [ ] Shows status badge (top right)
- [ ] All sections present
- [ ] Running totals in events table
- [ ] Budget summary highlighted
- [ ] Professional appearance

**Word Export:**
- [ ] DOCX downloads when clicked
- [ ] Opens in Word
- [ ] All content editable
- [ ] Tables formatted correctly
- [ ] Running totals visible

**Running Totals:**
- [ ] Shows in Section 7 form builder
- [ ] Table has running total column
- [ ] Calculations correct
- [ ] Shows in PDF export
- [ ] Shows in Word export
- [ ] Tooltip explains feature

---

## 📞 Need Help?

If you encounter issues:

1. **Check backend console** - Look for errors
2. **Check browser console** - Look for frontend errors
3. **Verify packages installed** - Run `npm list pdfkit docx`
4. **Test simple form first** - One with few events
5. **Check file permissions** - Ensure files are readable

**Come back with:**
- Specific error message
- Which export type (PDF or Word)
- Browser console output
- Backend console output
- Sample form ID for testing

---

## 🎨 Customization Options

### Add Church Logo to PDF:

In `export-routes.js`, find the header section and add:

```javascript
// Replace text header with logo
doc.image('path/to/church-logo.png', 50, 50, { width: 100 });
doc.text('Ministry Budget & Planning Form', 160, 60);
```

### Change PDF Colors:

Update these values in `export-routes.js`:
- Budget box color: `#eff6ff` (light blue)
- Border color: `#3b82f6` (blue)
- Status colors: Search for `fillColor` calls

### Adjust PDF Margins:

In the PDFDocument creation:
```javascript
const doc = new PDFDocument({ 
  margin: 50,  // Change this value
  size: 'LETTER' 
});
```

---

## 🏆 What You're Getting

### Professional Print Capability:
- Present forms to board
- Archive approved forms
- Share with finance committee
- Print for meetings
- Email to stakeholders

### Better Budget Tracking:
- See spending progression
- Identify budget trends
- Make informed decisions
- Show fiscal responsibility
- Demonstrate planning

### Complete Audit Trail:
- Export forms at any stage
- Compare draft vs approved
- Track changes over time
- Maintain records
- Meet compliance needs

---

**You're adding enterprise-grade reporting to your system!** 🎉

**Download the files and let's add these powerful features!** 🚀
