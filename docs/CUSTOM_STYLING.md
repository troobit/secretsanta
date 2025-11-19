# Custom Styling

## Custom Backgrounds

### Global Background (All Users)

The default background is defined in `public/css/theme-default.css`.

```css
/* public/css/theme-default.css */
#page-body {
  background-color: #f9fafb;
}
```

To change the global default, edit this file.

### Per-User Custom Backgrounds

The site automatically loads `public/css/{username}.css` when a user logs in.

- **Username:** The part of the email before the `@` (e.g., `john` for `john@example.com`).

#### Setup Steps

1. Create a CSS file named after the user's email username:
   - `public/css/john.css` (for `john@example.com`)
   - `public/css/mary.css` (for `mary@example.com`)

2. Add your custom CSS to that file. Target `#page-body` for the main background.

#### Examples

**Gradient Background:**

```css
/* public/css/john.css */
#page-body {
  background: linear-gradient(135deg, #165b33 0%, #052e16 100%) !important;
}
```

**Image Background:**

```css
/* public/css/mary.css */
#page-body {
  background-image: url('/images/winter-scene.jpg') !important;
  background-size: cover !important;
  background-position: center !important;
  background-attachment: fixed !important;
}
```

**SVG Pattern:**

```css
/* public/css/bob.css */
#page-body {
  background-image: url("data:image/svg+xml,%3Csvg...%3E") !important;
  background-color: #f8f9fa !important;
}
```

### Additional Styling

You can customize other elements by overriding Tailwind classes or IDs:

```css
/* Change card backgrounds */
.bg-white {
  background-color: #fef9f3 !important;
}

/* Change button colors */
button.bg-blue-600 {
  background-color: #dc2626 !important;
}
```

---

## Image/SVG Asset Storage

Store your background assets in:

- **Images**: `public/images/`
- **Reference**: `background-image: url('/images/your-file.jpg');`

---

## Alpine JS Basics (for this project)

This project uses [Alpine.js](https://alpinejs.dev/) for lightweight reactivity.

### How it works here

1. **`x-data`**: Defines a component's state.
   - `<div id="app" x-data="secretSantaApp()">` initializes the main app state.
2. **`x-show`**: Toggles visibility based on state.
   - `<div x-show="!user">` shows the login form only when no user is logged in.
3. **`Alpine.store` / `Alpine.data`**: Access state globally.
   - We use `Alpine.$data(document.getElementById('app'))` in `index.html` to read the current user state and inject the CSS file.
4. **`Alpine.effect`**: Runs a function whenever dependencies change.
   - We use this to watch for changes in `app.user` and trigger the CSS injection.

### The CSS Injection Logic

Located in `public/index.html`:

```javascript
window.addEventListener('alpine:init', () => {
  Alpine.effect(() => {
    const app = Alpine.$data(document.getElementById('app'));
    // Only load custom CSS for non-admin users
    if (app?.user?.email && !app.isAdmin) {
      const username = app.user.email.split('@')[0];
      // ... creates and appends <link href="css/username.css">
    }
  });
});
```
