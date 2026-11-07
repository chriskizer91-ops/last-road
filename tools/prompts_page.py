"""The picture prompts as a document (design/picture-prompts.md) and a page with a Copy button on each
(design/picture-prompts.html), from design/picture-prompts.json and design/picture-prompts-header.md.
usage: python3 tools/prompts_page.py   (from the repo's top)"""
import json, html, re
from collections import Counter
D = json.load(open('design/picture-prompts.json')); head = open('design/picture-prompts-header.md').read()
style = head.split('```')[1].strip()
first = ['A01','A02','A03','A04','A06','B01','B02','B04','B06','B07','B15','F01','F03','H01','H02','H03','H04','I01','I02','I03']
layouts = [l[2:] for l in head.split('## The layouts (each prompt names one)')[1].strip().split('\n') if l.startswith('- ')]
B2NOTE = "These follow the story you okayed (Fable's: the Old Hands, Venn and the radio voices). Make them after Batch 1's first 20."
md = [head, '', '## Batch 1 · make now', '']; cur = None
for b, title in (('b1', None), ('b2', '## Batch 2 · the story\'s places and people')):
    if title: md += [title, '', B2NOTE, '']; cur = None
    for x in D[b]:
        if x['sec'] != cur: cur = x['sec']; md += [f'### {cur}', '']
        md += [f"**{x['id']} · {x['title']}** · {x['lay']}", x['why'], '```', x['p'], '```', '']
c1 = Counter(x['L'] for x in D['b1']); c2 = Counter(x['L'] for x in D['b2'])
md += ['## How many, and what to make first', '', '| Batch | Sections | Pictures |', '| --- | --- | --- |',
       f"| 1 | {', '.join(f'{k} {v}' for k, v in sorted(c1.items()))} | {len(D['b1'])} |", f"| 2 | {', '.join(f'{k} {v}' for k, v in sorted(c2.items()))} | {len(D['b2'])} |", '',
       '**The first 20 to make** (enough for the first playable piece): ' + ', '.join(first) + '.', '']
open('design/picture-prompts.md', 'w').write('\n'.join(md))
mdh = lambda s: re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', html.escape(s)).replace('`', '')
data = {'b1': D['b1'], 'b2': D['b2'], 'first': first, 'style': style, 'b2note': B2NOTE}
page = open('tools/prompts_page.html').read().replace('%COUNT%', str(len(D['b1']) + len(D['b2']))).replace('%LAYOUTS%', ''.join(f'<li>{mdh(l)}</li>' for l in layouts)).replace('%DATA%', json.dumps(data))
open('design/picture-prompts.html', 'w').write(page); print('ok', len(D['b1']), len(D['b2']))
