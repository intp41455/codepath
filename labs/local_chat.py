"""Talk only to an already-running local Ollama instance. No cloud key required."""
import json
import time
import urllib.request
import urllib.error

def chat(model, prompt):
    payload=json.dumps({'model':model,'messages':[{'role':'user','content':prompt}],
                        'stream':False},ensure_ascii=False).encode('utf-8')
    request=urllib.request.Request('http://127.0.0.1:11434/api/chat',data=payload,
                                  headers={'Content-Type':'application/json'})
    # Avoid sending local requests through a configured remote proxy.
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request,timeout=60) as response:
        body=json.load(response)
    return body['message']['content']

def main():
    model=input('Full local model name from ollama list: ').strip()
    if not model:
        raise SystemExit('Model name cannot be empty.')
    prompt=input('Question (no private data): ').strip()
    if not prompt:
        raise SystemExit('Question cannot be empty.')
    start=time.monotonic()
    try:
        print(chat(model,prompt))
        print(f'Elapsed: {time.monotonic()-start:.2f}s')
    except urllib.error.HTTPError as exc:
        print(f'HTTP {exc.code}: check the exact model name and local service logs.')
        raise SystemExit(1)
    except (urllib.error.URLError,TimeoutError) as exc:
        print(f'Connection or timeout error: {exc}. Check the running local service.')
        raise SystemExit(1)
    except (KeyError,ValueError):
        raise SystemExit('Unexpected response structure; inspect local service version.')

if __name__=='__main__':
    main()
