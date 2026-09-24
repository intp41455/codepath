"""A transparent retrieval baseline. NO LLM and NO semantic embeddings.
Documents are synthetic. Permission filtering happens before ranking.
"""
DOCUMENTS = [
    {'id':'hours-v1','text':'library opens at nine','allowed':['student','staff']},
    {'id':'policy-v1','text':'library books can be borrowed for seven days','allowed':['student','staff']},
    {'id':'staff-v1','text':'staff budget is confidential','allowed':['staff']},
]

def retrieve(query, role, documents=DOCUMENTS, limit=2):
    terms=set(query.lower().split())
    candidates=[]
    for doc in documents:
        if role not in doc['allowed']:
            continue
        score=len(terms & set(doc['text'].lower().split()))
        if score:
            candidates.append((score,doc))
    return [doc for _,doc in sorted(candidates,key=lambda p:(-p[0],p[1]['id']))[:limit]]

def answer(query, role):
    evidence=retrieve(query,role)
    if not evidence:
        return {'status':'no_evidence','citations':[],'text':'No matching authorized evidence.'}
    # An extract, never an instruction to execute. It may still be irrelevant.
    return {'status':'evidence_only','citations':[d['id'] for d in evidence],
            'text':'\n'.join(f"[{d['id']}] {d['text']}" for d in evidence)}

def main():
    found=answer('opens','student')
    assert found['citations']==['hours-v1']
    assert answer('budget','student')['status']=='no_evidence'
    assert answer('budget','staff')['citations']==['staff-v1']
    assert answer('volcano','student')['status']=='no_evidence'
    assert answer('','student')['citations']==[]
    assert answer('opens','unknown')['citations']==[]
    print(found)
    print('PASS: evidence IDs, permission-before-ranking, missing evidence, empty and unknown role')
    print('Not tested: real LLM generation, embeddings, document-level factuality, production auth.')

if __name__=='__main__':
    main()
