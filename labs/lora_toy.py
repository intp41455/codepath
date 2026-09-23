"""Rank-one adaptation of a 2x2 matrix using only Python's standard library.
W is frozen. The update B*A is trained with hand-derived gradients.
This is NOT language-model fine-tuning or quantization.
"""
import json
import tempfile
from pathlib import Path

def predict(x, base, a, b):
    hidden = sum(ai * xi for ai, xi in zip(a, x))
    return [sum(w * xi for w, xi in zip(row, x)) + bi * hidden
            for row, bi in zip(base, b)]

def train(steps=1200):
    base = ((1.0, 0.0), (0.0, 1.0))
    # Desired delta [[1,2],[2,4]] has rank one.
    data = [([1., 0.], [2., 2.]), ([0., 1.], [2., 5.]), ([1., 1.], [4., 7.])]
    a, b = [0.1, -0.2], [0., 0.]
    def loss():
        return sum((p-y)**2 for x, ys in data for p, y in zip(predict(x, base, a, b), ys)) / len(data)
    initial = loss()
    for _ in range(steps):
        grad_a, grad_b = [0., 0.], [0., 0.]
        for x, target in data:
            hidden = sum(ai*xi for ai,xi in zip(a,x))
            error = [p-y for p,y in zip(predict(x,base,a,b),target)]
            for i in range(2):
                grad_b[i] += 2 * error[i] * hidden / len(data)
            for j in range(2):
                grad_a[j] += 2 * sum(error[i]*b[i] for i in range(2)) * x[j] / len(data)
        # Update simultaneously: both gradients were computed with the OLD weights.
        a = [v - 0.01*g for v,g in zip(a,grad_a)]
        b = [v - 0.01*g for v,g in zip(b,grad_b)]
    return base, a, b, initial, loss()

def main():
    base,a,b,initial,final=train()
    assert base == ((1.,0.),(0.,1.)), 'Base must stay frozen'
    assert final < 0.001 and final < initial/100, 'Adaptation failed'
    expected=predict([2.,-1.],base,a,b)
    assert max(abs(p-y) for p,y in zip(expected,[2.,-1.])) < 0.05
    with tempfile.TemporaryDirectory() as directory:
        file=Path(directory)/'adapter.json'
        file.write_text(json.dumps({'base_id':'identity-2-v1','a':a,'b':b}),encoding='utf-8')
        saved=json.loads(file.read_text(encoding='utf-8'))
        assert saved['base_id']=='identity-2-v1'
        assert predict([2.,-1.],base,saved['a'],saved['b'])==expected
    print(f'Initial loss: {initial:.6f}; final: {final:.6f}')
    print('PASS: frozen base, learned rank-one delta, reload, independent input')

if __name__=='__main__':
    main()
