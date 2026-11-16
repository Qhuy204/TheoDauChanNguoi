"""Export generated artwork to web formats; preserve the source images."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path('C:/Users/Qhuy/.codex/generated_images/01a1e590-4fdd-7db1-b57b-a1e1cb627daf')
images = {
    'hero': 'exec-26c24ba1-a5b0-4839-9b14-9427c5d1ab33.png',
    'harbor': 'exec-e1216ecc-e6b2-48f3-927a-1e7c361e0c0c.png',
    'activities': 'exec-2b80a68e-41cc-4032-b2d6-7c643deb9e60.png',
    'village': 'exec-c352799a-da74-40b0-8855-e534d1bb7267.png',
    'learning': 'exec-5a174819-223e-467f-8ac4-c6ebad05b858.png',
}
for name, original in images.items():
    target = ROOT / 'dist' / 'assets' / (name + '.webp')
    with Image.open(GENERATED / original) as artwork:
        artwork.convert('RGB').save(target, 'WEBP', quality=88, method=6)
    print(name, target.stat().st_size)
# Resize only this modern high-resolution photograph; retain its complete framing.
photo = ROOT / 'dist' / 'assets' / 'pac-bo.jpg'
with Image.open(photo) as image:
    if image.width > 1600:
        image.thumbnail((1600, 1600))
        image.save(photo, quality=88, optimize=True)
