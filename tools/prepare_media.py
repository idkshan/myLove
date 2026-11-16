"""Get the photos and songs in media/ ready for the website.

How to use it:
  1. Put new photos straight into a chapter folder, e.g. media/3rd/together3.jpg
     Name them her1, her2, ... (shown first) or together1, together2, ... (shown after).
     Any of .jpg, .jpeg or .png works, and capital letters are fine.
  2. To remove a photo, just delete it from its folder.
  3. Run this from the project folder:
         python tools/prepare_media.py

What it does:
  - New or changed photos are shrunk to web size, turned the right way up,
    cleaned of hidden data such as GPS location, and saved as lowercase .jpg.
    Photos that are already done are left alone.
  - Makes song file names lowercase (song.mp3).
  - Rewrites media/manifest.js, the list of photos the website reads.

New photos are replaced by their smaller web copies, so keep your own
originals somewhere else (for example in your phone's gallery).

To see what it would do without changing anything:
    python tools/prepare_media.py --check

Videos are skipped for now.
"""
import json
import os
import re
import sys

from PIL import Image, ImageOps

MEDIA = "media"
MAX_SIZE = 1600      # longest side, in pixels
QUALITY = 82         # JPEG quality

PHOTO = re.compile(r"^(her|together)(\d+)\.(jpe?g|png)$", re.IGNORECASE)
VIDEO = re.compile(r"\.(mov|mp4|m4v)$", re.IGNORECASE)


def chapter_number(name):
    """'1st' -> 1, '2nd' -> 2, ... (folders without a number are ignored)."""
    match = re.match(r"^(\d+)", name)
    return int(match.group(1)) if match else None


def needs_work(path, final_name):
    """True if this photo still has to be shrunk, cleaned or renamed."""
    if os.path.basename(path) != final_name:
        return True
    with Image.open(path) as img:
        return img.format != "JPEG" or max(img.size) > MAX_SIZE or len(img.getexif()) > 0


def prepare_photo(path, dest):
    """Shrink, turn the right way up, drop hidden data, save as JPEG at dest."""
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
        img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
        temp = dest + ".tmp"
        img.save(temp, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    os.remove(path)                 # remove first, so a name that only changes case (Her1.JPG) is renamed properly
    os.replace(temp, dest)


def photo_size(path):
    with Image.open(path) as img:
        return img.size


def fix_song_name(folder, check):
    """Finds song.mp3 in a folder (any capitals) and makes its name lowercase. Returns its path or None."""
    for name in os.listdir(folder):
        if name.lower() == "song.mp3":
            if name != "song.mp3" and not check:
                temp = os.path.join(folder, "song.tmp")
                os.rename(os.path.join(folder, name), temp)
                os.rename(temp, os.path.join(folder, "song.mp3"))
            return "song.mp3"
    return None


def main():
    check = "--check" in sys.argv
    if not os.path.isdir(MEDIA):
        raise SystemExit("Can't find the '%s' folder. Run this from the project folder." % MEDIA)

    folders = sorted((f for f in os.listdir(MEDIA) if os.path.isdir(os.path.join(MEDIA, f)) and chapter_number(f)),
                     key=chapter_number)
    chapters, changed = [], 0

    for folder in folders:
        folder_path = os.path.join(MEDIA, folder)
        photos, skipped, notes = {}, [], []

        for name in sorted(os.listdir(folder_path)):
            match = PHOTO.match(name)
            if match:
                kind = match.group(1).lower()
                key = (0 if kind == "her" else 1, int(match.group(2)))
                if key in photos:
                    notes.append("two photos called %s%d, skipped %s" % (kind, key[1], name))
                    continue
                photos[key] = name
            elif VIDEO.search(name):
                skipped.append(name)

        items = []
        for (group, number) in sorted(photos):
            name = photos[(group, number)]
            final_name = "%s%d.jpg" % ("her" if group == 0 else "together", number)
            path = os.path.join(folder_path, name)
            dest = os.path.join(folder_path, final_name)
            if needs_work(path, final_name):
                changed += 1
                notes.append("prepared " + (name if name == final_name else "%s -> %s" % (name, final_name)))
                if not check:
                    prepare_photo(path, dest)
            width, height = photo_size(dest if os.path.exists(dest) else path)
            items.append({"src": "%s/%s/%s" % (MEDIA, folder, final_name), "name": final_name, "w": width, "h": height})

        song = fix_song_name(folder_path, check)
        chapters.append({"folder": folder, "number": chapter_number(folder), "photos": items,
                         "song": "%s/%s/%s" % (MEDIA, folder, song) if song else None})

        line = "%-4s %2d photos%s" % (folder, len(items), "" if song else ", no song")
        if skipped:
            line += ", skipped videos: " + ", ".join(skipped)
        print(line)
        for note in notes:
            print("       " + note)

    finale_song = fix_song_name(MEDIA, check)
    manifest = {"chapters": chapters, "finaleSong": "%s/%s" % (MEDIA, finale_song) if finale_song else None}

    if check:
        print("Check only: nothing was changed. %d photo(s) would be prepared." % changed)
        return

    with open(os.path.join(MEDIA, "manifest.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("// Made by tools/prepare_media.py. Don't edit by hand: run the script again instead.\n")
        f.write("window.MEDIA = " + json.dumps(manifest, indent=2) + ";\n")

    total = sum(os.path.getsize(os.path.join(root, n)) for root, _, names in os.walk(MEDIA) for n in names)
    print("Done: %d photo(s) prepared, media/ is %.1f MB. Bouquet song: %s"
          % (changed, total / 1e6, "yes" if finale_song else "missing"))


if __name__ == "__main__":
    main()
