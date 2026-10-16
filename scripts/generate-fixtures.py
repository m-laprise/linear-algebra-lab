"""Independent SymPy oracle; deterministic half-integer cases for all nine shapes."""
import json
import random
from pathlib import Path
import sympy as sp

rng = random.Random(20261016)
cases = []
for m in range(1, 4):
    for n in range(1, 4):
        matrices = [sp.zeros(m,n), sp.eye(m,n)]
        matrices += [sp.Matrix(m,n,lambda i,j: sp.Rational(rng.randint(-6,6),2)) for _ in range(35)]
        matrices += [sp.Matrix(m,n,lambda i,j: (i+1)*(j+1)/sp.Integer(3)) * sp.Rational(3,2)]
        for a in matrices:
            # Keep the dependent fixture in the editor's allowed range.
            if max(abs(x) for x in a) > 3:
                a = sp.Matrix(m,n,lambda i,j: sp.Rational(j+1,2))
            x = sp.Matrix([sp.Rational(rng.randint(-6,6),2) for _ in range(n)])
            det = a.det() if m == n else None
            inv = a.inv() if det else None
            cases.append({
                'a': [[float(v) for v in row] for row in a.tolist()],
                'x': [float(v) for v in x],
                'y': [str(v) for v in a*x], 'rank': a.rank(),
                'det': str(det) if det is not None else None,
                'inverse': [[str(v) for v in row] for row in inv.tolist()] if inv is not None else None,
            })
out = Path('tests/fixtures/sympy.json')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(cases, indent=2)+'\n')
print(f'{len(cases)} independent cases written to {out}')
