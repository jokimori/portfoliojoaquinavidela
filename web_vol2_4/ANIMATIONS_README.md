# Fenómeno Page - Animation Features

## What's New ✨

Your `fenomeno.html` page now has dynamic animations that make it feel **alive**!

### 1. **Scroll Animations** 📜
Every element animates as you scroll down the page:
- **Text elements**: Slide up with fade-in effect
- **Headings**: Slide in from the left
- **Boxes & Rectangles**: Scale up smoothly
- **Smooth easing**: Uses cubic-bezier for natural motion

### 2. **Mouse-Tracking Rectangles** 🖱️
The `.rectangle-1` and `.rectangle-2` elements follow your mouse cursor:
- They move slightly in the direction of your mouse
- Creates a **3D parallax effect**
- Alternate directions for visual interest
- They also slightly rotate based on horizontal mouse movement

### 3. **Big Letter Parallax** 🔤
The large background letters (A and V) move with your mouse:
- Creates depth and parallax effect
- Makes the page feel interactive

### 4. **Hover Effects** ✨
- Boxes and rectangles get a subtle glow/shadow on hover
- Smooth transitions for all interactive elements

### 5. **Staggered Animations**
Child elements animate with slight delays for a cascading effect

---

## How It Works

### HTML Attributes
Elements are tagged with animation attributes:
```html
<div class="text-block" data-animate>Content here</div>
<div class="box" data-animate-scale>Box content</div>
<div class="heading" data-animate-left>Title</div>
```

**Available animation types:**
- `data-animate` - Slide up + fade
- `data-animate-fade` - Fade only
- `data-animate-scale` - Scale up + fade
- `data-animate-rotate` - Rotate + fade
- `data-animate-left` - Slide from left
- `data-animate-right` - Slide from right
- `data-animate-stagger` - Cascading child animations

### JavaScript Features
All animations are handled by `/assets/scroll-animations.js`:
- **Intersection Observer** for scroll detection
- **Mouse tracking** for rectangle movements
- **Parallax effects** for depth
- **Smooth transitions** with CSS easing

---

## Customization

### Adjust Animation Speed
Edit the transition duration in `scroll-animations.js`:
```javascript
// Current: 0.8s
transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Adjust Mouse Tracking Intensity
Change the `intensity` value in the `MouseTracker` class:
```javascript
this.intensity = 0.02; // Increase for more movement (0.01 - 0.1)
```

### Add More Animations
Simply add animation attributes to any HTML element:
```html
<div class="my-element" data-animate>This will animate!</div>
```

---

## Browser Support
Works on all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

---

## Performance Notes
- Uses `will-change: transform` for GPU acceleration
- Efficient Intersection Observer API
- Smooth 60fps animations
- No third-party animation libraries required

Enjoy your interactive page! 🎉
