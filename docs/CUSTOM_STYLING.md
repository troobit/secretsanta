# Custom Styling

## Custom Backgrounds

### Global Background (All Users)

Edit `index.html` directly. The `<body>` tag uses Tailwind classes by default:

```html
<body class="bg-gray-50 min-h-screen">
```

#### Option 1: Solid Color (Tailwind)

Replace `bg-gray-50` with any Tailwind color class:

```html
<body class="bg-blue-100 min-h-screen">
```

#### Option 2: CSS Gradient

Add a `<style>` block in the `<head>` section:

```html
<style>
  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  }
</style>
```

#### Option 3: Image Background

```html
<style>
  body {
    background-image: url('/path/to/your/image.jpg') !important;
    background-size: cover !important;
    background-position: center !important;
    background-attachment: fixed !important;
  }
</style>
```

#### Option 4: SVG Background

Inline SVG pattern:

```html
<style>
  body {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L0 30L30 60L60 30Z' fill='%23f0f0f0'/%3E%3C/svg%3E") !important;
    background-color: #ffffff !important;
  }
</style>
```

Or reference an SVG file:

```html
<style>
  body {
    background-image: url('/path/to/pattern.svg') !important;
    background-size: 200px 200px !important;
    background-repeat: repeat !important;
  }
</style>
```

---

## Per-User Custom Backgrounds

The site automatically loads `public/css/{username}.css` when a user logs in (username is the part before @ in their email).

### Setup Steps

1. Create a CSS file named after the user's email username:
   - For `john@example.com` → create `public/css/john.css`
   - For `mary@example.com` → create `public/css/mary.css`

2. Add your custom background CSS to that file

### Background Examples

#### Gradient Background

```css
/* public/css/john.css */
body {
  background: linear-gradient(135deg, #165b33 0%, #052e16 100%) !important;
}
```

#### Image Background

```css
/* public/css/mary.css */
body {
  background-image: url('/images/winter-scene.jpg') !important;
  background-size: cover !important;
  background-position: center !important;
  background-attachment: fixed !important;
}
```

#### SVG Pattern Background

```css
/* public/css/bob.css */
body {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23e0e0e0' stroke-width='2'/%3E%3C/svg%3E") !important;
  background-color: #f8f9fa !important;
  background-size: 100px 100px !important;
}
```

#### External SVG File

```css
/* public/css/alice.css */
body {
  background-image: url('/images/snowflakes.svg') !important;
  background-size: 150px 150px !important;
  background-repeat: repeat !important;
  background-color: #1e3a8a !important;
}
```

### Additional Styling

You can customize other elements too:

```css
/* Change card backgrounds */
.bg-white {
  background-color: #fef9f3 !important;
}

/* Change button colors */
button.bg-blue-600 {
  background-color: #dc2626 !important;
}

button.bg-blue-600:hover {
  background-color: #b91c1c !important;
}

/* Change heading colors */
h1, h2, h3 {
  color: #f59e0b !important;
}
```

See `public/css/example-christmas.css` for a complete reference theme.

---

## Image/SVG Asset Storage

Store your background assets in:

- **Images**: `public/images/` (create this folder if needed)
- **SVG files**: `public/images/` or inline as data URIs

Reference them in CSS:

```css
background-image: url('/images/your-file.jpg');
/* or */
background-image: url('/images/your-pattern.svg');
```

## Tips

- **Use `!important`** to override Tailwind's utility classes
