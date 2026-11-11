"""Ask a model through Christopher's key: python3 ask.py <model> <effort> <prompt.md> <out.md> [system.md] [image ...]
Streams (long answers), saves the answer text to out.md and the usage to out.md.json. The key is read from
~/.secrets/anthropic_key and never written anywhere else (never put a key in this repo). Copied into the repo Nov 11 2026
(it was /home/claude/scripts/ask.py); tools/models/run_asset.py calls it."""
import sys, json, time, base64, anthropic, mimetypes
model, effort, pf, out = sys.argv[1:5]
system = open(sys.argv[5]).read() if len(sys.argv) > 5 and sys.argv[5] != '-' else None
imgs = sys.argv[6:]
key = open(__import__('os').path.expanduser('~/.secrets/anthropic_key')).read().strip()
c = anthropic.Anthropic(api_key=key, max_retries=4, timeout=3600)
content = []
for p in imgs:
    mt = mimetypes.guess_type(p)[0] or 'image/png'
    content.append({'type': 'image', 'source': {'type': 'base64', 'media_type': mt, 'data': base64.b64encode(open(p, 'rb').read()).decode()}})
content.append({'type': 'text', 'text': open(pf).read()})
kw = dict(model=model, max_tokens=int(__import__('os').environ.get('MAXTOK', 64000)), messages=[{'role': 'user', 'content': content}],
          thinking={'type': 'adaptive'}, output_config={'effort': effort})
if system: kw['system'] = system
t0 = time.time(); text = []
with c.messages.stream(**kw) as s:
    for ev in s:
        if ev.type == 'content_block_delta' and getattr(ev.delta, 'type', '') == 'text_delta': text.append(ev.delta.text)
    m = s.get_final_message()
open(out, 'w').write(''.join(text))
u = m.usage
json.dump({'model': model, 'effort': effort, 'seconds': round(time.time() - t0), 'stop': m.stop_reason,
           'in': u.input_tokens, 'out': u.output_tokens}, open(out + '.json', 'w'))
print('done', model, effort, round(time.time() - t0), 's', u.input_tokens, 'in', u.output_tokens, 'out', m.stop_reason)
