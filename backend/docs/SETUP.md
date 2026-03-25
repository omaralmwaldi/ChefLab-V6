# ChefLab — Backend setup commands

Run these from the backend directory (`ChefLab V5/backend/`).

---

## 1. Create virtual environment

```bash
python3 -m venv .venv
```

## 2. Activate virtual environment

**macOS/Linux:**

```bash
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Windows (CMD):**

```cmd
.venv\Scripts\activate.bat
```

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

**Dependencies installed:**

- django
- djangorestframework
- psycopg2-binary
- djangorestframework-simplejwt
- django-filter
- django-cors-headers
- Pillow

## 4. Create Django project (already done)

If starting from scratch:

```bash
django-admin startproject config .
```

This creates `config/` and `manage.py` in the current directory.

## 5. Create apps (already done)

```bash
python manage.py startapp accounts
python manage.py startapp recipes
python manage.py startapp ingredients
python manage.py startapp categories
```

---

## Verify

```bash
python manage.py check
```

Expected: `System check identified no issues (0 silenced).`

---

## Project structure after Step 2

```
ChefLab V5/backend/
├── .venv/
├── config/
│   ├── __init__.py
│   ├── settings.py    # INSTALLED_APPS + middleware updated
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/
├── categories/
├── ingredients/
├── recipes/
├── docs/
│   └── SETUP.md
├── manage.py
├── README.md
└── requirements.txt
```
