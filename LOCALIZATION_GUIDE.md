# Localization Guide - Aseedak

This guide explains how to use the localization system implemented in the Aseedak application, which supports both English and Arabic languages with RTL (Right-to-Left) support.

## Overview

The localization system includes:
- **Languages**: English (en) and Arabic (ar)
- **RTL Support**: Automatic direction switching for Arabic
- **Next.js i18n**: Built-in internationalization support
- **Dynamic Language Switching**: Real-time language changes
- **Comprehensive Translations**: All UI elements translated

## File Structure

```
├── lib/
│   └── i18n.ts                 # Core localization utilities
├── hooks/
│   └── useTranslation.ts       # Translation hook
├── contexts/
│   └── LocaleContext.tsx       # Locale context provider
├── components/
│   ├── LanguageSwitcher.tsx    # Language switching component
│   └── RTLWrapper.tsx          # RTL layout wrapper
├── messages/
│   ├── en.json                 # English translations
│   └── ar.json                 # Arabic translations
└── app/
    └── localization-demo/      # Demo page showcasing localization
```

## Configuration

### Context-Based Localization

The localization system uses React Context for state management:

```javascript
// LocaleProvider wraps the entire app
<LocaleProvider>
  <App />
</LocaleProvider>
```

### Provider Setup

The `LocaleProvider` is included in the main providers:

```javascript
export function Providers({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  )
}
```

### Message Files

Translation files are located in the `messages/` directory:
- `en.json` - English translations
- `ar.json` - Arabic translations

Both files follow the same structure with nested objects for organization.

## Usage

### Basic Translation Hook

```tsx
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t, locale, changeLanguage, isRTL, direction } = useTranslation();
  
  return (
    <div>
      <h1>{t('landing.title')}</h1>
      <p>{t('landing.description')}</p>
      <button onClick={() => changeLanguage('ar')}>
        Switch to Arabic
      </button>
    </div>
  );
};
```

### Translation Function

The `t` function supports nested keys and parameter interpolation:

```tsx
// Simple translation
t('common.loading') // "Loading..." or "جاري التحميل..."

// Nested keys
t('auth.login.title') // "Sign In" or "تسجيل الدخول"

// With parameters
t('validation.minLength', { min: 8 }) // "Must be at least 8 characters"
```

### Language Switcher Component

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Dropdown variant (default)
<LanguageSwitcher variant="dropdown" showFlags={true} />

// Button variant
<LanguageSwitcher variant="button" showFlags={true} />
```

### RTL Support

```tsx
import RTLWrapper from '@/components/RTLWrapper';

const MyPage = () => {
  return (
    <RTLWrapper>
      <div>
        {/* Your content here - automatically handles RTL for Arabic */}
      </div>
    </RTLWrapper>
  );
};
```

## Translation Keys Structure

The translation files are organized into logical sections:

### Common
- `common.loading`, `common.error`, `common.success`
- `common.cancel`, `common.confirm`, `common.save`
- `common.delete`, `common.edit`, `common.back`

### Authentication
- `auth.login.*` - Login form translations
- `auth.register.*` - Registration form translations
- `auth.verifyEmail.*` - Email verification translations
- `auth.forgotPassword.*` - Password reset translations

### Game
- `game.createRoom.*` - Room creation translations
- `game.joinRoom.*` - Room joining translations
- `game.gameRoom.*` - In-game translations

### Admin
- `admin.*` - Admin panel translations
- `admin.users.*` - User management translations
- `admin.words.*` - Word management translations

### Store
- `store.*` - Store/purchase translations

### Profile
- `profile.*` - User profile translations

### Notifications
- `notifications.*` - Notification settings translations

### Errors & Success
- `errors.*` - Error message translations
- `success.*` - Success message translations

### Validation
- `validation.*` - Form validation translations

## Adding New Translations

### 1. Add to Message Files

Add the new key to both `en.json` and `ar.json`:

```json
// en.json
{
  "newSection": {
    "newKey": "New English Text"
  }
}

// ar.json
{
  "newSection": {
    "newKey": "نص عربي جديد"
  }
}
```

### 2. Use in Components

```tsx
const { t } = useTranslation();
return <div>{t('newSection.newKey')}</div>;
```

## RTL Styling

The application includes RTL-specific CSS classes:

```css
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .space-x-4 > * + * {
  margin-left: 0;
  margin-right: 1rem;
}
```

## Demo Page

Visit `/localization-demo` to see the localization system in action. This page demonstrates:
- Language switching
- RTL layout changes
- All translation categories
- Form elements in both languages

## Best Practices

### 1. Consistent Key Naming
Use descriptive, hierarchical keys:
```json
"auth.login.email" // Good
"email" // Avoid - too generic
```

### 2. Parameter Interpolation
Use parameters for dynamic content:
```json
"validation.minLength": "Must be at least {{min}} characters"
```

### 3. RTL Considerations
- Test layouts in both languages
- Use semantic HTML
- Avoid hardcoded directions in CSS
- Test form layouts and spacing

### 4. Translation Quality
- Ensure Arabic translations are culturally appropriate
- Test with native speakers
- Maintain consistent terminology
- Consider context and tone

## Browser Support

The localization system works in all modern browsers and includes:
- Automatic locale detection from browser language
- Persistent language preferences (stored in localStorage)
- Context-based state management
- Fallback to default locale

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in both language files
2. **RTL not working**: Ensure `RTLWrapper` is used in the component tree
3. **Language not switching**: Verify `LocaleProvider` is wrapping your app
4. **Styling issues**: Check RTL-specific CSS classes
5. **Context error**: Ensure `useTranslation` is used within `LocaleProvider`

### Debug Mode

Enable debug mode to see translation keys:

```tsx
const { t } = useTranslation();
console.log('Current locale:', locale);
console.log('Translation key:', t('some.key'));
```

## Future Enhancements

Potential improvements for the localization system:
- Add more languages
- Implement pluralization rules
- Add date/time formatting
- Include number formatting
- Add currency formatting
- Implement lazy loading for translations

## Support

For questions or issues with the localization system, please refer to:
- Next.js i18n documentation
- React i18n best practices
- RTL web development guidelines
