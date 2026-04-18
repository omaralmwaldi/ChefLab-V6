import random
import string


def generate_unique_sku(model, *, prefix: str = "SKU", length: int = 8) -> str:
    """Generate a unique SKU for any model with a `sku` field."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        candidate = f"{prefix}-" + "".join(random.choices(alphabet, k=length))
        if not model.objects.filter(sku=candidate).exists():
            return candidate
