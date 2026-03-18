# SelectBottomSheet Migration Helper

## Quick Migration Guide

### Before & After Examples

#### Example 1: Simple Select
```jsx
// BEFORE: Radix UI Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="inactive">Inactive</SelectItem>
  </SelectContent>
</Select>

// AFTER: SelectBottomSheet
import SelectBottomSheet from "@/components/kora/SelectBottomSheet";

<SelectBottomSheet
  value={status}
  onChange={setStatus}
  placeholder="Select status"
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ]}
/>
```

#### Example 2: Select with Descriptions
```jsx
// BEFORE: Radix UI Select with custom content
<Select value={tradeType} onValueChange={setTradeType}>
  <SelectTrigger>
    <SelectValue placeholder="Trade type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="plumbing">Plumbing</SelectItem>
    <SelectItem value="electrical">Electrical</SelectItem>
  </SelectContent>
</Select>

// AFTER: SelectBottomSheet with descriptions
<SelectBottomSheet
  value={tradeType}
  onChange={setTradeType}
  placeholder="Trade type"
  options={[
    { 
      value: "plumbing", 
      label: "Plumbing",
      description: "Pipes, fixtures, and water systems"
    },
    { 
      value: "electrical", 
      label: "Electrical",
      description: "Wiring, outlets, and safety systems"
    }
  ]}
/>
```

#### Example 3: Select with Label
```jsx
// BEFORE
<label>Role</label>
<Select value={role} onValueChange={setRole}>
  {/* ... */}
</Select>

// AFTER
<SelectBottomSheet
  label="Role"
  value={role}
  onChange={setRole}
  placeholder="Select role"
  options={[
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" }
  ]}
/>
```

#### Example 4: Disabled State
```jsx
// BEFORE
<Select value={value} onValueChange={setValue} disabled={isLoading}>
  {/* ... */}
</Select>

// AFTER
<SelectBottomSheet
  value={value}
  onChange={setValue}
  disabled={isLoading}
  placeholder="Select..."
  options={options}
/>
```

---

## Migration Checklist

### Step 1: Identify Selects to Migrate
```bash
# Search for these patterns in your codebase:
grep -r "SelectContent" src/
grep -r "<select" src/
grep -r "SelectTrigger" src/
```

### Step 2: Create Options Array
```jsx
// Extract options from SelectItem elements
const options = [
  { value: "val1", label: "Label 1", description: "Optional description" },
  { value: "val2", label: "Label 2" },
];
```

### Step 3: Replace Component
```jsx
// 1. Remove old imports
- import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 2. Add new import
+ import SelectBottomSheet from "@/components/kora/SelectBottomSheet";

// 3. Replace JSX
- <Select>...</Select>
+ <SelectBottomSheet />
```

### Step 4: Test
```jsx
// Test these scenarios:
// 1. ✓ Value changes
// 2. ✓ Search filtering (if enabled)
// 3. ✓ Disabled state
// 4. ✓ Touch targets (44px minimum)
// 5. ✓ Mobile layout
```

---

## Pages to Migrate

### High Priority (User-facing)
- [ ] pages/Settings - role, language, currency selects
- [ ] pages/IssueDetail - status, category selects
- [ ] pages/JobDetail - status, priority selects
- [ ] pages/PostJob - trade type select

### Medium Priority (Less frequently used)
- [ ] pages/TradesProfile - specialty, availability selects
- [ ] pages/ContractorManagement - status select
- [ ] components/contractor/BlockTimeDialog - recurrence select

### Low Priority (Backend/Admin)
- [ ] pages/TeamManagement - role select
- [ ] pages/Integrations - service select

---

## Component Props Reference

```typescript
interface SelectBottomSheetProps {
  value: string | null;                    // Current selected value
  onChange: (value: string) => void;       // Change callback
  options: SelectOption[];                 // Array of options
  placeholder?: string;                    // Placeholder text
  label?: string;                          // Optional label above trigger
  className?: string;                      // Extra CSS classes
  disabled?: boolean;                      // Disable the select
  searchable?: boolean;                    // Enable search (default: true)
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;                    // Optional description text
}
```

---

## Common Patterns

### Multi-select (Future Enhancement)
```jsx
// Currently SelectBottomSheet is single-select
// For multi-select, use with state management:

const [selected, setSelected] = useState([]);

// Workaround: Create multiple single selects
{options.map(opt => (
  <SelectBottomSheet
    key={opt.value}
    value={selected.includes(opt.value) ? opt.value : ""}
    onChange={(val) => {
      setSelected(prev => 
        prev.includes(val) 
          ? prev.filter(v => v !== val)
          : [...prev, val]
      );
    }}
  />
))}
```

### Dependent Selects
```jsx
// When second select depends on first:
const [category, setCategory] = useState("");
const [type, setType] = useState("");

// Filter type options based on category
const typeOptions = type_map[category] || [];

<SelectBottomSheet
  label="Category"
  value={category}
  onChange={(val) => {
    setCategory(val);
    setType(""); // Reset dependent select
  }}
  options={categoryOptions}
/>

{category && (
  <SelectBottomSheet
    label="Type"
    value={type}
    onChange={setType}
    options={typeOptions}
  />
)}
```

### Async Options
```jsx
// When options load from API:
const [options, setOptions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchOptions().then(setOptions).finally(() => setLoading(false));
}, []);

<SelectBottomSheet
  value={value}
  onChange={setValue}
  options={options}
  disabled={loading}
  placeholder={loading ? "Loading..." : "Select..."}
/>
```

---

## Styling Customization

### Custom Colors
```jsx
// SelectBottomSheet uses Tailwind by default
// To customize, override with className:

<SelectBottomSheet
  // ... props
  className="bg-blue-50 border-blue-300"
/>
```

### Custom Sizes
The component automatically enforces 44px touch targets.
To add extra padding:

```jsx
<SelectBottomSheet
  // ... props
  className="px-6"  // Extra horizontal padding
/>
```

---

## Accessibility Features

SelectBottomSheet includes:
- ✅ ARIA labels and roles
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support
- ✅ 44x44px touch targets
- ✅ Focus indicators
- ✅ Search field focus management

---

## Troubleshooting

### Select doesn't open
```jsx
// Check that onClick handler isn't blocked
// Verify not inside form with onSubmit handler that prevents default
// Ensure drawer component is properly mounted
```

### Search not working
```jsx
// Make sure searchable={true} (default)
// Check options array has valid label values
// Verify text is visible in console.log(options)
```

### Touch target too small
```jsx
// The component enforces minHeight: 44px automatically
// If trigger appears smaller, check parent sizing
// Use browser inspector to verify computed minHeight
```

### Bottom sheet not scrollable
```jsx
// Max height is 70vh by default
// For very long lists (100+ items), consider pagination
// Use searchable=true to reduce visible items
```

---

## Performance Tips

### Large Lists (100+ items)
```jsx
// Enable search to help users find items
<SelectBottomSheet
  // ... props
  searchable={true}  // Enables filtering
  options={options}
/>

// Or use virtual scrolling (future enhancement)
```

### Dynamic Options
```jsx
// Memoize options to prevent re-renders
const options = useMemo(() => 
  data.map(item => ({
    value: item.id,
    label: item.name
  })), 
  [data]
);
```

---

## Testing Examples

```jsx
// Component test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectBottomSheet from '@/components/kora/SelectBottomSheet';

test('selects value on click', async () => {
  const onChange = jest.fn();
  render(
    <SelectBottomSheet
      value=""
      onChange={onChange}
      options={[{ value: "a", label: "Option A" }]}
    />
  );

  await userEvent.click(screen.getByText('Select...'));
  await userEvent.click(screen.getByText('Option A'));

  expect(onChange).toHaveBeenCalledWith('a');
});
```

---

## Migration Timeline

**Week 1:** Settings, IssueDetail
**Week 2:** JobDetail, PostJob
**Week 3:** Other pages

---

**Last Updated:** 2026-03-18