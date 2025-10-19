# Table Editor Feature Documentation

## Overview
The post editor has been enhanced to support table creation and editing functionality using the quill-better-table module.

## Features

### Table Creation
- **Table Button**: A dedicated table button (⊞) has been added to the editor toolbar
- **Default Size**: Clicking the table button inserts a 3x3 table by default
- **Easy Access**: Located in the toolbar alongside other formatting options

### Table Editing
Users can edit tables through:
- **Direct Cell Editing**: Click any cell to edit its content
- **Text Formatting**: Apply bold, italic, underline, and other text formatting within cells
- **Context Menu**: Right-click on any cell to access advanced options:
  - Insert row above/below
  - Insert column left/right
  - Delete row/column
  - Merge/unmerge cells

### Keyboard Navigation
- Navigate between cells using Tab and arrow keys
- Standard keyboard shortcuts work within table cells
- Keyboard bindings from quill-better-table enabled

### Copy-Paste Support
- Copy and paste table data from spreadsheets
- Preserve table structure when pasting
- Standard clipboard operations work seamlessly

### Responsive Design
- Tables are fully responsive on mobile devices
- Horizontal scroll enabled for tables wider than viewport
- Appropriate padding and font sizing for different screen sizes
- Tables maintain readability across all devices

## Technical Implementation

### Dependencies
- **quill-better-table v1.2.10**: Loaded from unpkg CDN
- Integrated with existing Quill 1.3.7 setup

### Files Modified
1. **components/Admin/PostEditor.tsx**
   - Added QuillBetterTable to window interface
   - Updated toolbar configuration to include table button
   - Added table formats (table, table-cell-line)
   - Registered better-table module with Quill
   - Configured table operation menu and keyboard bindings

2. **pages/admin/post/[id].tsx**
   - Added quill-better-table CSS link

3. **pages/admin/post/new.tsx**
   - Added quill-better-table CSS link

4. **pages/post/[slug].tsx**
   - Added quill-better-table CSS link for published posts

5. **styles/globals.css**
   - Added table styling for consistent appearance
   - Added responsive styles for mobile devices
   - Configured table borders, padding, and hover effects

### CSS Styling
```css
/* Table base styles */
table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
}

table td, table th {
    border: 1px solid #ddd;
    padding: 8px 12px;
    word-wrap: break-word;
}

table th {
    background-color: #f2f2f2;
    font-weight: 600;
    text-align: left;
}

/* Mobile responsive */
@media (max-width: 768px) {
    table {
        font-size: 0.875rem;
    }
    table td, table th {
        padding: 6px 8px;
    }
}
```

## Usage Instructions

### Creating a Table
1. Open the post editor (create new post or edit existing)
2. Click the table button (⊞) in the toolbar
3. A 3x3 table will be inserted at the cursor position
4. Click cells to edit content

### Editing Table Structure
1. Right-click on any table cell
2. Select from the context menu:
   - **Insert row above/below**: Adds a new row
   - **Insert column left/right**: Adds a new column
   - **Delete row/column**: Removes the current row/column
   - **Merge cells**: Combine selected cells (if supported)
   - **Unmerge cells**: Split merged cells

### Formatting Cell Content
1. Select text within a cell
2. Use toolbar buttons to apply formatting (bold, italic, etc.)
3. All standard Quill formatting options work within cells

### Publishing
- Tables are automatically saved with the post content
- Published posts display tables with proper styling
- No additional steps required for table publishing

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design ensures compatibility across devices

## Accessibility
- Tables use proper HTML semantic elements
- Screen readers can navigate table structure
- Keyboard navigation fully supported
- Context menu accessible via keyboard shortcuts

## Known Limitations
- Default table size is 3x3 (can be modified after insertion)
- Advanced features like cell merging depend on quill-better-table capabilities
- Large tables may require horizontal scrolling on mobile devices

## Future Enhancements
- Customizable default table size (allow users to specify rows/columns)
- Table templates for common layouts
- Import/export table data from CSV
- Advanced styling options (cell colors, borders, etc.)

## Troubleshooting

### Table button not appearing
- Ensure all scripts are loaded (check browser console)
- Verify quill-better-table CSS and JS are included
- Clear browser cache and reload

### Tables not rendering in published posts
- Verify quill-better-table CSS is included in post view page
- Check that table HTML is properly saved in post content

### Mobile display issues
- Tables should scroll horizontally on small screens
- If not scrolling, verify responsive CSS is applied
- Check viewport meta tag is present

## Resources
- [Quill Documentation](https://quilljs.com/)
- [quill-better-table GitHub](https://github.com/soccerloway/quill-better-table)
