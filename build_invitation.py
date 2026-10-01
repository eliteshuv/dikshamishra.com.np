from pathlib import Path
from PIL import Image
import base64, io

root=Path(__file__).parent
generated=Path(r'C:\Users\elite\.codex\generated_images\01a0f63c-4ae2-76f1-b7fb-d360b6a0af31')
for source,name in [('exec-f9730261-551c-495b-a1c0-9cccafb353e7.png','janakpur-portrait'),('exec-3f21ca43-c692-4584-b216-900b37eab91c.png','ritual-portrait')]:
    if (generated/source).exists() and not (root/'assets'/f'{name}.webp').exists():
        Image.open(generated/source).save(root/'assets'/f'{name}.webp',quality=86)
html=(root/'invitation.source.html').read_text(encoding='utf-8-sig').strip()+'\n'
for name in ['wedding-hero','ritual-hands','mandap-night','janakpur-portrait','ritual-portrait']:
    path=root/'assets'/f'{name}.png'
    if not path.exists(): path=root/'assets'/f'{name}.webp'
    buffer=io.BytesIO()
    Image.open(path).save(buffer,format='WEBP',quality=85)
    html=html.replace('{{'+name+'}}','data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode())
(root/'index.html').write_text(html,encoding='utf-8')
print('Built self-contained index.html:',len(html),'characters')
