"""Run the actual standard-library labs, including deliberately wrong controls."""
import importlib.util
from pathlib import Path
from unittest.mock import patch
import io
import json
import urllib.error

root=Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,root/'labs'/f'{name}.py')
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

lora=load('lora_toy')
lora.main()
_,_,_,before,after=lora.train(steps=0)
assert before==after and after>0.001, 'Zero training must not masquerade as learned'
rag=load('rag_lab')
rag.main()
# Sensitivity: taking away a permission removes the real result.
assert rag.retrieve('opens','student',[{'id':'x','text':'opens','allowed':['staff']}])==[]
assert rag.retrieve('opens','student',[{'id':'x','text':'opens','allowed':['student']}])[0]['id']=='x'
local=load('local_chat')
class FakeOpener:
    def open(self, request, timeout):
        assert request.full_url=='http://127.0.0.1:11434/api/chat'
        body=json.loads(request.data)
        assert body['model']=='local-test' and body['stream'] is False
        assert timeout==60
        return io.BytesIO(json.dumps({'message':{'content':'fixture reply'}}).encode())
with patch.object(local.urllib.request,'build_opener',return_value=FakeOpener()):
    assert local.chat('local-test','hello')=='fixture reply'
# No real model was contacted: this only tests the HTTP client contract.
with patch('builtins.input',side_effect=['local-test','hello']), patch.object(local,'chat',side_effect=urllib.error.URLError('refused')):
    try:
        local.main()
    except SystemExit as error:
        assert error.code==1
    else:
        raise AssertionError('Failure was reported as success')
print('PASS: stdlib labs, no-training negative control, permission sensitivity, local client fixture and failure path')
