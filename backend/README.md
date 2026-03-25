# ChefLab

Recipe management system — recipes, ingredients, and approval workflow.

## Tech stack (backend)

- Python, Django, Django REST Framework
- PostgreSQL
- JWT (Simple JWT)

## Setup

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (after DB is configured)
python manage.py migrate

# Run development server
python manage.py runserver
```

## Project structure

- `config/` — Django project settings and root URL config
- `manage.py` — Django CLI entry point

Next steps will add apps and configure database and auth.
