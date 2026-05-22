# Project skills / notes

This file is a lightweight “working agreement” for contributors and for AI tooling when generating code in this repo.

## Architecture rules

- `netlify/functions/*.js`:
  - Only routing/adapter code (HTTP input/output).
  - No DB queries or complex business rules here.
- `backend/controllers/*.js`:
  - Translate HTTP-ish inputs into service calls.
  - Validate/normalize request data (or delegate to `backend/utils/validators.js`).
- `backend/services/*.js`:
  - Business logic and orchestration.
  - Enforce permissions and workflows.
- `backend/repositories/*.js`:
  - All persistence (Supabase/DB/storage). No HTTP concerns here.
- `backend/config/*.js`:
  - Instantiate clients and centralize configuration.
- `backend/utils/*.js`:
  - Reusable helpers (response formatting, pagination, hashing, slug, etc.).
- `backend/constants/*.js`:
  - Keep message strings and role names centralized.

## Naming / structure

- Prefer plural resource names for modules: `categories`, `products`, `users`, `orders`.
- Keep files aligned across layers when possible:
  - `netlify/functions/products.js`
  - `backend/controllers/products.controller.js`
  - `backend/services/products.service.js`
  - `backend/repositories/products.repository.js`
- If you introduce a new resource, add it consistently across the layers above.

## Error handling

- Use a single response shape from `backend/utils/response.js` (success/error helpers).
- Don’t leak internal error details to the client; return a safe message (see `backend/constants/messages.js`).

## Auth / permissions

- Roles belong in `backend/constants/roles.js`.
- Permission checks live in services (`backend/services/*`) and may use `backend/utils/permissions.js`.

## Frontend conventions

- Page scripts go in `public/assets/js/pages/`.
- Shared UI behavior goes in `public/assets/js/components/`.
- Keep DOM helpers in `public/assets/js/utils/`.

# Database Entities

## users

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR(150) | User name |
| email | VARCHAR(255) | Unique user email |
| phone | VARCHAR(30) | User phone number |
| password_hash | TEXT | User password hash |
| role | user_role | User role: `common`, `seller`, `admin` |
| is_active | BOOLEAN | Defines if the user is active |
| created_at | TIMESTAMPTZ | Record creation date |
| updated_at | TIMESTAMPTZ | Record last update date |

---

## addresses

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to `users.id` |
| cep | VARCHAR(20) | Postal code |
| street | VARCHAR(255) | Street name |
| number | VARCHAR(20) | Address number |
| neighborhood | VARCHAR(120) | Neighborhood |
| city | VARCHAR(120) | City |
| state | VARCHAR(120) | State |
| complement | VARCHAR(255) | Address complement |
| reference | VARCHAR(255) | Reference information |
| location_link | TEXT | Map/location link |
| created_at | TIMESTAMPTZ | Record creation date |
| updated_at | TIMESTAMPTZ | Record last update date |

---

## categories

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR(120) | Category name |
| description | TEXT | Category description |
| is_active | BOOLEAN | Defines if the category is active |
| created_at | TIMESTAMPTZ | Record creation date |
| updated_at | TIMESTAMPTZ | Record last update date |

---

## products

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| category_id | UUID | Foreign key to `categories.id` |
| name | VARCHAR(150) | Product name |
| slug | VARCHAR(180) | Unique product slug |
| description | TEXT | Product description |
| price_cents | INTEGER | Product price in cents |
| discount_cents | INTEGER | Discount in cents |
| is_active | BOOLEAN | Defines if the product is active |
| created_at | TIMESTAMPTZ | Record creation date |
| updated_at | TIMESTAMPTZ | Record last update date |

---

## product_images

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| product_id | UUID | Foreign key to `products.id` |
| path | TEXT | Image path |
| alt_text | VARCHAR(255) | Alternative text for the image |
| is_cover | BOOLEAN | Defines if the image is the cover image |
| created_at | TIMESTAMPTZ | Record creation date |
| updated_at | TIMESTAMPTZ | Record last update date |

---

# Relationships

- One **user** can have many **addresses**
- One **category** can have many **products**
- One **product** can have many **product_images**