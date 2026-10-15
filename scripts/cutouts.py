# The reciters' photos without their background (scripts/cutouts.mjs lists them
# in work/todo.json): the person only, cropped to them, at most 720 px high,
# WebP with transparency, in work/out; work/done.json says which are good
# (a photo of a person: some photos are logos or posters, kept as they are).
import json, os
from PIL import Image
from rembg import remove, new_session

todo = json.load(open('work/todo.json'))
os.makedirs('work/out', exist_ok=True)
session = new_session('u2net_human_seg')
done = []
for t in todo:
    entry = {**t, 'ok': False}
    try:
        src = Image.open(t['file']).convert('RGB')
        cut = remove(src, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240,
                      alpha_matting_background_threshold=12, alpha_matting_erode_size=8)
        alpha = cut.getchannel('A')
        box = alpha.getbbox()
        # How much of the photo is the person, and whether they reach its foot (a portrait does)
        covered = sum(1 for a in alpha.getdata() if a > 128) / (alpha.width * alpha.height)
        if not box or covered < 0.08:
            entry['why'] = 'no person found'
        elif covered > 0.92:
            entry['why'] = 'nothing taken away'
        elif box[3] < alpha.height * 0.85:
            entry['why'] = 'the person is cut off above the foot of the photo'
        else:
            entry['ok'] = True
        if box:
            cut = cut.crop(box)
            if cut.height > 720:
                cut = cut.resize((round(cut.width * 720 / cut.height), 720), Image.LANCZOS)
            out = f"work/out/{t['id']}.webp"
            cut.save(out, 'WEBP', quality=86, method=6)
            entry['out'] = out
            entry['covered'] = round(covered, 3)
    except Exception as e:
        entry['why'] = f'error: {e}'
    done.append(entry)
    print(t['id'], t['name'], 'ok' if entry['ok'] else entry.get('why'), flush=True)
json.dump(done, open('work/done.json', 'w'), ensure_ascii=False, indent=1)
