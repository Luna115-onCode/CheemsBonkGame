import os
from PIL import Image

def batch_convert_png_to_webp(folder_path, quality=85):
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(".png"):
            png_path = os.path.join(folder_path, filename)
            webp_filename = os.path.splitext(filename)[0] + ".webp"
            webp_path = os.path.join(folder_path, webp_filename)
            
            with Image.open(png_path) as img:
                img.save(webp_path, "webp", quality=quality)
            print(f"Converted: {filename} -> {webp_filename}")

batch_convert_png_to_webp("public/img/cheems", 100)
batch_convert_png_to_webp("public/img/hit", 100)
batch_convert_png_to_webp("public/img/music", 100)

