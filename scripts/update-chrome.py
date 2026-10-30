"""Apply the shared navigation/footer and replace decorative Unicode with SVG."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
file=root/'lib/page-templates.json'
site=json.loads(file.read_text())
site['header']=(root/'design/header.html').read_text()
site['footer']=(root/'design/footer.html').read_text()
def icon(path):
 return '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+path+'"/></svg>'
symbols={'↗':icon('M5 19 19 5M5 5h14v14'),'↘':icon('M5 5 19 19M5 19h14V5'),'↓':icon('M12 4v16m-6-6 6 6 6-6'),'→':icon('M4 12h16m-6-6 6 6-6 6'),'←':icon('M20 12H4m6-6-6 6 6 6'),'✳':icon('M5 20C3 11 9 4 20 4c0 10-5 16-15 16Zm0 0L16 9'),'✓':icon('m5 12 4 4L19 6')}
def clean(html):
 for symbol,svg in symbols.items():html=html.replace(symbol,svg)
 return html
site['header']=clean(site['header']);site['footer']=clean(site['footer'])
for page in site['pages'].values():page['body']=clean(page['body'])
file.write_text(json.dumps(site,indent=2)+'\n')
