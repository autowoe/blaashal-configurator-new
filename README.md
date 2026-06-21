# Blaashal Configurator

Webapplicatie voor het configureren en offreren van blaashallen. Klanten kunnen een hal samenstellen op basis van componenten en configuraties; medewerkers beheren projecten, kennisbank en offertes via een interne interface.

## Technologieën

### Frontend
| Technologie | Versie | Gebruik |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type-safe JavaScript |
| Vite | 7 | Bundler / dev server |
| Tailwind CSS | 4 | Styling |
| shadcn/ui (Base UI) | — | UI componenten |
| React Three Fiber / Three.js | 9 / 0.184 | 3D visualisatie van hallen |
| React Router | 7 | Client-side routing |
| React Hook Form + Zod | — | Formulieren en validatie |
| TanStack Table | 8 | Datatables |

### Backend
| Technologie | Versie | Gebruik |
|---|---|---|
| Django | 6.0 | Web framework |
| Django REST Framework | 3.17 | REST API |
| Gunicorn | — | WSGI server (productie) |
| WhiteNoise | — | Statische bestanden |
| psycopg2 | — | PostgreSQL driver |
| pytesseract + Tesseract | — | OCR voor gescande documenten |
| PyMuPDF / pdfminer | — | PDF-extractie |
| python-docx / python-pptx / openpyxl | — | Office-document extractie |
| Anthropic Claude | — | AI-assistent (chat) |
| Voyage AI (`voyage-3`) | — | Semantische embeddings (RAG) |
| NumPy | — | Vectorrekenwerk voor hybride retrieval |

### Opslag
| Omgeving | Database | Bestandsopslag |
|---|---|---|
| Ontwikkeling | SQLite | Lokaal (`media/`) |
| Productie | PostgreSQL | Backblaze B2 (S3-compatibel) |

### AI / Kennisbank
De kennisbank gebruikt **hybride retrieval**: BM25 (keyword, 30%) gecombineerd met semantische cosine similarity op Voyage AI-embeddings (70%). Embeddings worden opgeslagen als JSON in de database. Fallback naar puur BM25 als er nog geen embeddings zijn.

---

## Lokaal draaien

### Vereisten
- Python 3.12+
- Node.js 20+
- Tesseract OCR ([installatiegids](https://github.com/tesseract-ocr/tesseract))

### Backend

```bash
cd backend

# Virtuele omgeving aanmaken en activeren
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Afhankelijkheden installeren
pip install -r requirements.txt

# .env aanmaken (zie sectie Omgevingsvariabelen hieronder)
cp .env.example .env  # of maak handmatig aan

# Database migreren
python manage.py migrate

# (Optioneel) superuser aanmaken
python manage.py createsuperuser

# Dev server starten
python manage.py runserver
```

De API is bereikbaar op `http://localhost:8000`.

### Frontend

```bash
cd frontend

# Afhankelijkheden installeren
npm install

# Dev server starten
npm run dev
```

De frontend is bereikbaar op `http://localhost:5173`.

---

## Omgevingsvariabelen

Maak een `.env` aan in de `backend/` map:

```env
# Django
SECRET_KEY=jouw-geheime-sleutel
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
ENVIRONMENT=development  # of 'production'

# AI
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=

# Productie: PostgreSQL
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

# Productie: Backblaze B2 (S3-compatibel)
BB_KEY_ID=
BB_APP_KEY=
BB_ENDPOINT_URL=

# E-mail (productie)
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@blaashal.nl

# Fal.ai (optioneel)
FAL_KEY=
```

---

## Docker Compose

```yaml
services:
  frontend:
    image: ghcr.io/autowoe/blaashal-configurator-frontend:latest
    ports:
      - 80:80

  backend:
    image: ghcr.io/autowoe/blaashal-configurator-backend:latest
    env_file:
      - .env
    depends_on:
      - db
    ports:
      - 8000:8000
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media

  db:
    image: postgres:16
    environment:
      - POSTGRES_DB
      - POSTGRES_USER
      - POSTGRES_PASSWORD
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

---

## Django apps

| App | Verantwoordelijkheid |
|---|---|
| `organizations` | Organisaties en gebruikersbeheer |
| `projects` | Projecten en offertes |
| `components` | Componentenbibliotheek |
| `configurations` | Halkonfiguraties |
| `visualization` | 3D-visualisatiedata |
| `knowledge_base` | RAG-kennisbank en AI-chat |
