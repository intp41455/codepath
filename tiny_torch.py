"""CPU training lab: synthetic regression, saving, reloading. No model download."""
from pathlib import Path
import tempfile

def main():
    import torch
    from torch import nn
    torch.manual_seed(7)
    # Each row is one sample; the second dimension is one feature.
    x = torch.linspace(-1, 1, 41).reshape(-1, 1)
    y = 2 * x + 1
    model = nn.Sequential(nn.Linear(1, 8), nn.Tanh(), nn.Linear(8, 1))
    loss_fn = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.02)
    initial = loss_fn(model(x), y).item()
    for _ in range(600):
        optimizer.zero_grad()
        prediction = model(x)
        loss = loss_fn(prediction, y)
        loss.backward()
        optimizer.step()
    model.eval()
    # Independent inputs within the same synthetic task, not a real-world benchmark.
    test_x = torch.tensor([[-0.85], [0.15], [0.75]])
    with torch.no_grad():
        before = model(test_x)
        test_loss = loss_fn(before, 2 * test_x + 1).item()
    with tempfile.TemporaryDirectory() as folder:
        checkpoint = Path(folder) / 'weights.pt'
        torch.save(model.state_dict(), checkpoint)
        restored = nn.Sequential(nn.Linear(1, 8), nn.Tanh(), nn.Linear(8, 1))
        restored.load_state_dict(torch.load(checkpoint, weights_only=True))
        restored.eval()
        with torch.no_grad():
            after = restored(test_x)
        assert torch.allclose(before, after), 'Reload changed predictions'
    assert loss.item() < initial / 10, 'Training did not improve enough'
    assert test_loss < 0.02, 'Independent synthetic inputs failed'
    print(f'Initial loss: {initial:.6f}; final: {loss.item():.6f}; test: {test_loss:.6f}')
    print('PASS: reload preserves predictions. CPU toy task only.')

if __name__ == '__main__':
    main()
