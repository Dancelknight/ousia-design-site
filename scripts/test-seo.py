from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import xml.etree.ElementTree as ET
import json
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
 def find(self,tag,**attrs):return [a for t,a in self.tags if t==tag and all(a.get(k)==v for k,v in attrs.items())]
r=Path(__file__).resolve().parent.parent
urls=[e.text for e in ET.parse(r/'sitemap.xml').iter() if e.tag.endswith('loc')]
assert len(urls)==len(set(urls))
for url in urls:
 p=r/(urlparse(url).path.lstrip('/')+'index.html');text=p.read_text();s=Page(text)
 assert len(s.find('h1'))==1,(p,'h1')
 assert s.find('link',rel='canonical')==[{'rel':'canonical','href':url}],(p,'canonical')
 assert len(s.find('meta',name='description'))==1 and s.find('meta',name='description')[0]['content'],p
 assert not any('noindex' in a.get('content','') for a in s.find('meta',name='robots')),p
 import re
 for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S):json.loads(block)
 for a in s.find('a'):
  h=a.get('href','');v=urlparse(h)
  if v.scheme or h.startswith('#') or not v.path:continue
  target=r/v.path.lstrip('/') if v.path.startswith('/') else p.parent/unquote(v.path)
  if not target.suffix:target=target/'index.html'
  assert target.exists(),(p,h)
 for a in s.find('link',rel='alternate'):
  assert (r/(urlparse(a['href']).path.lstrip('/')+'index.html')).exists(),(p,a)
 for img in s.find('img'):
  assert 'alt' in img,(p,'missing alt')
print('PASS:',len(urls),'sitemap URLs: H1, canonical, descriptions, indexability, JSON-LD, internal links, language targets and alt attributes')
