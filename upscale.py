from PIL import Image, ImageEnhance, ImageFilter

# Open the image
img_path = "public/icon.png"
img = Image.open(img_path)

# Ensure it's RGBA
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Upscale by 2x using LANCZOS for high quality
new_size = (img.width * 2, img.height * 2)
img = img.resize(new_size, Image.Resampling.LANCZOS)

# Enhance sharpness
enhancer = ImageEnhance.Sharpness(img)
img = enhancer.enhance(1.5)  # Increase sharpness

# Apply a subtle unsharp mask filter to further clarify edges
img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))

# Enhance contrast slightly to make it pop
contrast_enhancer = ImageEnhance.Contrast(img)
img = contrast_enhancer.enhance(1.1)

# Save the improved image
img.save(img_path, format="PNG")
print("Image upscaled and enhanced successfully.")
