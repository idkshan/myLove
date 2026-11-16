"""Prepare the photos and songs in the Us folder for the website.

What it does:
  - Reads Us/1st ... Us/7th (and Us/song.mp3 for the bouquet).
  - Shrinks each photo to web size, fixes its rotation, and removes hidden
    data such as GPS location.
  - Saves everything into media/ with lowercase names.
  - Writes media/manifest.js, the list of photos the website reads.

Your original files in Us are never changed.

Run it from the project folder:
    python tools/prepare_media.py

Order of photos in each chapter: her1, her2, ... then together1, together2, ...
Videos are skipped for now.
"""
import json
import os
import re
import shutil

from PIL import Image, ImageOps

SOURCE = "Us"
OUTPUT = "media"
MAX_SIZE = 1600      # longest side, in pixels
QUALITY = 82         # JPEG quality

PHOTO = re.compile(r"^(her|together)(\d+)\.(jpe?g|png)$", re.IGNORECASE)
VIDEO = re.compile(r"\.(mov|mp4|m4v)$", re.IGNORECASE)


def chapter_number(name):
    """'1st' -> 1, '2nd' -> 2, ... (folders without a number are ignored)."""
    match = re.match(r"^(\d+)", name)
    return int(match.group(1)) if match else None


def save_photo(src, dest):
    """Shrink, rotate correctly, drop hidden data, save as JPEG. Returns (width, height)."""
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
        img.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        return img.size


def main():
    if not os.path.isdir(SOURCE):
        raise SystemExit("Can't find the '%s' folder. Run this from the project folder." % SOURCE)
    os.makedirs(OUTPUT, exist_ok=True)

    folders = sorted((f for f in os.listdir(SOURCE) if os.path.isdir(os.path.join(SOURCE, f)) and chapter_number(f)),
                     key=chapter_number)
    chapters = []

    for folder in folders:
        src_dir = os.path.join(SOURCE, folder)
        out_dir = os.path.join(OUTPUT, folder.lower())
        os.makedirs(out_dir, exist_ok=True)

        photos, skipped = [], []
        for name in os.listdir(src_dir):
            match = PHOTO.match(name)
            if match:
                group = 0 if match.group(1).lower() == "her" else 1
                photos.append((group, int(match.group(2)), name))
            elif VIDEO.search(name):
                skipped.append(name)
        photos.sort()

        items = []
        for group, number, name in photos:
            out_name = "%s%d.jpg" % ("her" if group == 0 else "together", number)
            width, height = save_photo(os.path.join(src_dir, name), os.path.join(out_dir, out_name))
            items.append({"src": "%s/%s/%s" % (OUTPUT, folder.lower(), out_name), "name": out_name, "w": width, "h": height})

        song = None
        if os.path.isfile(os.path.join(src_dir, "song.mp3")):
            shutil.copyfile(os.path.join(src_dir, "song.mp3"), os.path.join(out_dir, "song.mp3"))
            song = "%s/%s/song.mp3" % (OUTPUT, folder.lower())

        chapters.append({"folder": folder.lower(), "number": chapter_number(folder), "photos": items, "song": song})
        print("%-4s %2d photos%s%s" % (folder, len(items), "" if song else ", no song",
                                     (", skipped videos: " + ", ".join(sorted(skipped))) if skipped else ""))

    finale_song = None
    if os.path.isfile(os.path.join(SOURCE, "song.mp3")):
        shutil.copyfile(os.path.join(SOURCE, "song.mp3"), os.path.join(OUTPUT, "song.mp3"))
        finale_song = "%s/song.mp3" % OUTPUT

    manifest = {"chapters": chapters, "finaleSong": finale_song}
    with open(os.path.join(OUTPUT, "manifest.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Made by tools/prepare_media.py. Don't edit by hand: run the script again instead.\n")
        f.write("window.MEDIA = " + json.dumps(manifest, indent=2) + ";\n")

    total = sum(os.path.getsize(os.path.join(root, n)) for root, _, names in os.walk(OUTPUT) for n in names)
    print("Done: media/ is %.1f MB. Finale song: %s" % (total / 1e6, "yes" if finale_song else "missing"))


if __name__ == "__main__":
    main()
