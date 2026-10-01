from pathlib import Path
from PIL import Image
import base64, io

root=Path(__file__).parent
generated=Path(r'C:\Users\elite\.codex\generated_images\01a0f63c-4ae2-76f1-b7fb-d360b6a0af31')
for source,name in [('exec-f9730261-551c-495b-a1c0-9cccafb353e7.png','janakpur-portrait'),('exec-3f21ca43-c692-4584-b216-900b37eab91c.png','ritual-portrait'),('exec-3241bae4-2b21-4337-b68d-c6c0ad0a512e.png','couple-portrait'),('exec-08465c4c-a276-4c71-a73a-ead73458a624.png','ganesha-cutout')]:
    if (generated/source).exists() and not (root/'assets'/f'{name}.webp').exists():
        Image.open(generated/source).save(root/'assets'/f'{name}.webp',quality=86)
html=(root/'invitation.source.html').read_text(encoding='utf-8-sig').strip()+'\n'
css_start=html.index('/* Complete backgrounds')
css_end=html.index('</style>',css_start)
html=html[:css_start]+(root/'responsive-v2.css').read_text(encoding='utf-8')+'\n'+html[css_end:]
js_start=html.index('// INTERACTIVE_DETAILS_START')
js_end=html.index('// INTERACTIVE_DETAILS_END',js_start)
html=html[:js_start]+'// INTERACTIVE_DETAILS_START\n'+(root/'interactions-v2.js').read_text(encoding='utf-8')+'\n'+html[js_end:]
for name in ['wedding-hero','ritual-hands','mandap-night','janakpur-portrait','ritual-portrait','couple-portrait','ganesha-cutout']:
    path=root/'assets'/f'{name}.png'
    if not path.exists(): path=root/'assets'/f'{name}.webp'
    buffer=io.BytesIO()
    artwork=Image.open(path)
    if name=='ganesha-cutout': artwork.thumbnail((320,320))
    elif name in ['couple-portrait','janakpur-portrait','ritual-portrait']: artwork.thumbnail((960,1440))
    artwork.save(buffer,format='WEBP',quality=82)
    html=html.replace('{{'+name+'}}','data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode())
(root/'index.html').write_text(html,encoding='utf-8')
print('Built self-contained index.html:',len(html),'characters')
