# Multilingual Farmer Dashboard Implementation Guide

## Overview
The Farmer Dashboard module has been extended to support multilingual UI using the existing custom translation system with i18n-style key-based architecture. The implementation follows the same pattern as the Login screen and is designed to be scalable for future modules.

## Architecture

### Translation System
- **Framework**: Custom LanguageContext (React Context API)
- **Supported Languages**: English (en), Hindi (hi), Marathi (mr)
- **Translation Files**: JSON-based static translations
- **Location**: `src/translations/{en,hi,mr}.json`

### How It Works
1. **LanguageContext** (`src/context/LanguageContext.js`) provides:
   - `t(key, params)` function for translation lookup
   - Language switching via `changeLanguage(lang)`
   - Current language state
   - Auto-detection of device language

2. **Translation Keys**: Nested structure using dot notation
   - Format: `module.submodule.key` (e.g., `farmer.dashboard.title`)
   - Organized by functional area for scalability

3. **Interpolation**: Supports parameter replacement
   - Pattern: `{{paramName}}`
   - Example: `"You have {{count}} items"` → `"You have 5 items"`

## Implementation Details

### Files Modified

#### 1. Translation Files
- `src/translations/en.json`
- `src/translations/hi.json`
- `src/translations/mr.json`

**Added Keys:**
- Common section: `close` button
- Dashboard section: 
  - Quick actions: `quickActions`, `addCropQuickAction`, `myCropsQuickAction`, `proposalsQuickAction`, `ordersQuickAction`
  - Earnings: `earningsAndPayments`, `earningsDescription`
  - Support modal: `videoPlaceholder`, `videoSubtextPlatform`
  - Alerts: `pendingProposalsAlert` (with count interpolation)

#### 2. FarmerDashboardScreen Component
- **File**: `src/screens/farmer/FarmerDashboardScreen.js`
- **Import**: Already using `useLanguage()` hook
- **Changes**:
  - Replaced all hardcoded strings with `t()` function calls
  - Quick action buttons now use translation keys
  - Support modal text uses translations
  - Alert messages use translated strings with dynamic count

**Example Code Before:**
```javascript
<Text style={styles.quickActionText}>Add Crop</Text>
```

**Example Code After:**
```javascript
<Text style={styles.quickActionText}>{t('farmer.dashboard.addCropQuickAction')}</Text>
```

### Translation Key Structure

```
farmer
  └── dashboard
      ├── title: "Farmer Dashboard"
      ├── welcome: "Welcome to Farmer Dashboard"
      ├── totalCrops: "Total Crops"
      ├── activeListings: "Active Listings"
      ├── pendingOrders: "Pending Orders"
      ├── totalEarnings: "Total Earnings"
      ├── description: "Manage your crops..."
      ├── quickActions: "Quick Actions"
      ├── addCropQuickAction: "Add Crop"
      ├── myCropsQuickAction: "My Crops"
      ├── proposalsQuickAction: "Proposals"
      ├── ordersQuickAction: "Orders"
      ├── earningsAndPayments: "Earnings & Payments"
      ├── earningsDescription: "Track receivables, settlements..."
      ├── videoPlaceholder: "Video Player Placeholder"
      ├── videoSubtextPlatform: "YouTube video would play here"
      ├── pendingProposalsAlert: "You have {{count}} new proposal to review"
      ├── pendingOrdersAlert: "You have {{count}} pending order(s)"
      ├── myCrops: "My Crops"
      ├── myCropsDescription: "View and manage your crop listings"
      ├── [... and 30+ more keys]
      └── supportHours: "Support Hours: 9 AM - 6 PM"
common
  └── close: "Close"
```

## Language Switching

The Farmer Dashboard automatically reflects the selected language because it uses the shared LanguageContext:

```javascript
// In any component
const { t, changeLanguage } = useLanguage();

// Automatically updates all components using t()
changeLanguage('hi'); // Switch to Hindi
```

**Language Switcher Component**: `src/components/common/LanguageSwitcher.js`
- Available in the app for users to switch languages
- Persists language preference to localStorage

## Best Practices Implemented

✅ **No Hardcoded Text**: All visible UI strings use translation keys
✅ **Nested Keys**: Organized by module (`farmer.dashboard.*`)
✅ **Scalable Structure**: Easy to add new keys and modules
✅ **Interpolation Support**: Dynamic values via `{{paramName}}`
✅ **Pluralization Ready**: Component handles count-based logic
✅ **Consistent Naming**: Same naming convention across all languages
✅ **No Backend Data Translation**: Only UI text is translated
✅ **Fallback Support**: Falls back to English if translation missing

## Usage Examples

### Basic Translation
```javascript
const { t } = useLanguage();

<Text>{t('farmer.dashboard.title')}</Text>
// Output: "Farmer Dashboard" (English)
//         "किसान डैशबोर्ड" (Hindi)
//         "शेतकरी डॅशबोर्ड" (Marathi)
```

### With Parameters
```javascript
const { t } = useLanguage();

<Text>{t('farmer.dashboard.pendingProposalsAlert', { count: 3 })}</Text>
// Output: "You have 3 new proposal to review"
```

### Changing Language
```javascript
const { changeLanguage } = useLanguage();

<Button onPress={() => changeLanguage('hi')} title="हिंदी" />
```

## Testing Multilingual Support

### Manual Testing Steps:
1. **Open the app** and navigate to Farmer Dashboard
2. **Use Language Switcher** to change language to Hindi or Marathi
3. **Verify all text updates**:
   - Dashboard title ✓
   - Stat card labels ✓
   - Quick action buttons ✓
   - Alert messages ✓
   - Modal text ✓
   - Support information ✓

### Expected Outputs by Language:

#### English (en)
- Dashboard Title: "Farmer Dashboard"
- Quick Actions: "Add Crop", "My Crops", "Proposals", "Orders"
- Alert: "You have 2 new proposals to review"

#### Hindi (hi)
- Dashboard Title: "किसान डैशबोर्ड"
- Quick Actions: "फसल जोड़ें", "मेरी फसलें", "प्रस्ताव", "आदेश"
- Alert: "आपके पास 2 नया प्रस्ताव को समीक्षा करने के लिए"

#### Marathi (mr)
- Dashboard Title: "शेतकरी डॅशबोर्ड"
- Quick Actions: "पीक जोडा", "माझी पिके", "प्रस्ताव", "ऑर्डर"
- Alert: "आपल्याकडे 2 नवीन प्रस्ताव पुनरावलोकन करण्यासाठी"

## Extending to Other Modules

To add multilingual support to other screens/modules:

### Step 1: Add Translation Keys
Update `en.json` with new module keys:
```json
"moduleName": {
  "screenTitle": "Screen Title",
  "buttonLabel": "Button Label",
  "description": "Description text"
}
```

### Step 2: Add Hindi Translations
Update `hi.json` with matching structure

### Step 3: Add Marathi Translations
Update `mr.json` with matching structure

### Step 4: Update Component
```javascript
import { useLanguage } from '../../context/LanguageContext';

const MyScreen = () => {
  const { t } = useLanguage();
  
  return (
    <View>
      <Text>{t('moduleName.screenTitle')}</Text>
      <Button title={t('moduleName.buttonLabel')} />
    </View>
  );
};
```

## Scalability Benefits

1. **Modular Structure**: Each module has its own translation section
2. **Easy Additions**: Add new keys without affecting existing translations
3. **Team-Friendly**: Translators only see relevant strings
4. **Version Control**: Easy to track translation changes in git
5. **No Runtime Overhead**: Static JSON files, no API calls
6. **Fallback Mechanism**: Missing translations default to English or the key itself

## Performance Considerations

- **No API Calls**: All translations are bundled with the app
- **Instant Switching**: Language changes are immediate
- **Minimal Bundle Size**: JSON files are lightweight
- **No Runtime Compilation**: Simple string interpolation

## Future Enhancements

Potential improvements for future phases:

1. **Pluralization Helper**: Utility function for smart pluralization
2. **Date/Time Formatting**: Locale-aware date/number formatting
3. **RTL Support**: For future Arabic/Hebrew support
4. **Translation Management UI**: Admin panel for managing strings
5. **Dynamic Loading**: Load translations on-demand for large apps
6. **Translation Keys Export**: Generate keys automatically from templates

## Troubleshooting

### Translation Not Showing
1. Check key exists in all language JSON files
2. Verify module name matches (e.g., `farmer.dashboard`)
3. Check for typos in `t()` function call
4. Console will show missing key as fallback

### Language Not Changing
1. Verify `changeLanguage()` is called with valid code ('en', 'hi', 'mr')
2. Check LanguageContext is properly wrapped in app
3. Ensure component uses `useLanguage()` hook correctly

### JSON Syntax Errors
1. Use JSON linter to validate syntax
2. Ensure proper comma placement
3. No trailing commas in objects
4. All strings properly quoted

## Summary

The Farmer Dashboard is now fully multilingual using a scalable, maintainable system. The implementation follows best practices and provides a foundation for extending multilingual support across the entire FarmConnect application. All UI text is externalized into translation files, making it easy to support additional languages or update existing translations without code changes.
