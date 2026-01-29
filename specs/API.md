# WhiskeyPedia API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://whiskeypedia.replit.app/api
```

## Authentication

All protected routes require a valid JWT token in an httpOnly cookie named `token`.

### Auth Endpoints

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "whiskeyfan"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "whiskeyfan"
  },
  "message": "Registration successful"
}
```

**Errors:**
- 400: Validation error (missing fields, invalid email, weak password)
- 409: Email already exists

---

#### POST /auth/login
Authenticate and receive JWT cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "whiskeyfan"
  },
  "message": "Login successful"
}
```

Sets httpOnly cookie: `token=<jwt>`

**Errors:**
- 401: Invalid credentials

---

#### POST /auth/logout
Clear authentication cookie.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

#### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "whiskeyfan"
  }
}
```

**Errors:**
- 401: Not authenticated

---

### Whiskey Endpoints

#### GET /whiskeys
Get user's whiskey collection.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | all | Filter: all, sealed, open, finished |
| type | string | all | Filter by whiskey type |
| wishlist | boolean | false | True = wishlist only |
| search | string | | Search name/distillery |
| sort | string | created_at | Sort field |
| order | string | desc | Sort order: asc, desc |

**Response (200):**
```json
{
  "whiskeys": [
    {
      "id": 1,
      "name": "Eagle Rare 10 Year",
      "type": "Bourbon",
      "age": 10,
      "abv": 45.0,
      "proof": 90.0,
      "price": 34.99,
      "status": "open",
      "is_wishlist": false,
      "distillery": {
        "id": 1,
        "name": "Buffalo Trace Distillery",
        "location": "Frankfort, Kentucky"
      },
      "review": {
        "star_rating": 4.5,
        "point_rating": 88
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

#### GET /whiskeys/:id
Get single whiskey with full details.

**Response (200):**
```json
{
  "whiskey": {
    "id": 1,
    "name": "Eagle Rare 10 Year",
    "type": "Bourbon",
    "age": 10,
    "abv": 45.0,
    "proof": 90.0,
    "price": 34.99,
    "purchase_date": "2024-01-15",
    "purchase_location": "Total Wine",
    "status": "open",
    "opened_date": "2024-02-01",
    "is_wishlist": false,
    "is_public": false,
    "notes": "Gift from dad",
    "distillery": {
      "id": 1,
      "name": "Buffalo Trace Distillery",
      "location": "Frankfort, Kentucky",
      "country": "USA",
      "region": "Kentucky"
    },
    "review": {
      "id": 1,
      "taste_score": 8,
      "finish_score": 8,
      "mouthfeel_score": 7,
      "nose_score": 8,
      "value_score": 9,
      "overall_score": 8,
      "weighted_score": 8.05,
      "star_rating": 4.5,
      "point_rating": 88,
      "tasting_notes": "Vanilla, caramel, oak...",
      "flavor_tags": ["vanilla", "caramel", "oak", "honey"]
    }
  }
}
```

**Errors:**
- 404: Whiskey not found
- 403: Not your whiskey

---

#### POST /whiskeys
Add new whiskey to collection.

**Request:**
```json
{
  "name": "Eagle Rare 10 Year",
  "type": "Bourbon",
  "distillery_id": 1,
  "age": 10,
  "abv": 45.0,
  "price": 34.99,
  "purchase_date": "2024-01-15",
  "purchase_location": "Total Wine",
  "status": "sealed",
  "is_wishlist": false,
  "notes": "Gift from dad"
}
```

**Response (201):**
```json
{
  "whiskey": {
    "id": 1,
    ...full whiskey object
  },
  "message": "Whiskey added successfully"
}
```

**Errors:**
- 400: Validation error

---

#### PUT /whiskeys/:id
Update whiskey details.

**Request:** (partial update allowed)
```json
{
  "status": "open",
  "opened_date": "2024-02-01"
}
```

**Response (200):**
```json
{
  "whiskey": { ...updated whiskey },
  "message": "Whiskey updated successfully"
}
```

**Errors:**
- 404: Not found
- 403: Not your whiskey

---

#### DELETE /whiskeys/:id
Remove whiskey from collection.

**Response (200):**
```json
{
  "message": "Whiskey deleted successfully"
}
```

**Errors:**
- 404: Not found
- 403: Not your whiskey
- 401: ⚠️ KNOWN BUG - Session token validation may fail

---

### Review Endpoints

#### GET /reviews/:whiskey_id
Get review for a specific whiskey.

**Response (200):**
```json
{
  "review": {
    "id": 1,
    "whiskey_id": 1,
    "taste_score": 8,
    "finish_score": 8,
    "mouthfeel_score": 7,
    "nose_score": 8,
    "value_score": 9,
    "overall_score": 8,
    "weighted_score": 8.05,
    "star_rating": 4.5,
    "point_rating": 88,
    "tasting_notes": "Rich vanilla and caramel...",
    "ai_generated_notes": "Full AI expansion...",
    "flavor_tags": ["vanilla", "caramel", "oak"]
  }
}
```

**Errors:**
- 404: No review exists

---

#### POST /reviews
Create new review.

**Request:**
```json
{
  "whiskey_id": 1,
  "taste_score": 8,
  "finish_score": 8,
  "mouthfeel_score": 7,
  "nose_score": 8,
  "value_score": 9,
  "overall_score": 8,
  "tasting_notes": "Vanilla, caramel, oak",
  "flavor_tags": ["vanilla", "caramel", "oak"]
}
```

**Response (201):**
```json
{
  "review": {
    ...full review with calculated scores
  },
  "message": "Review created successfully"
}
```

Server calculates: weighted_score, star_rating, point_rating

---

#### PUT /reviews/:id
Update existing review.

**Request:** (partial update allowed)
```json
{
  "taste_score": 9,
  "tasting_notes": "Updated notes..."
}
```

**Response (200):**
```json
{
  "review": { ...updated review with recalculated scores },
  "message": "Review updated successfully"
}
```

**Errors:**
- 404: Review not found
- 403: Not your review
- ⚠️ POTENTIAL BUG - Edit flow may have issues

---

#### DELETE /reviews/:id
Delete a review.

**Response (200):**
```json
{
  "message": "Review deleted successfully"
}
```

---

### Distillery Endpoints

#### GET /distilleries
Get all distilleries (for autocomplete).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Filter by name |
| country | string | Filter by country |
| limit | number | Max results (default 50) |

**Response (200):**
```json
{
  "distilleries": [
    {
      "id": 1,
      "name": "Buffalo Trace Distillery",
      "location": "Frankfort, Kentucky",
      "country": "USA",
      "region": "Kentucky",
      "type": "Bourbon"
    }
  ]
}
```

---

#### GET /distilleries/:id
Get single distillery with details.

---

#### POST /distilleries
Add new distillery (when not in database).

**Request:**
```json
{
  "name": "New Distillery",
  "location": "City, State",
  "country": "USA",
  "region": "State",
  "type": "Bourbon"
}
```

---

### AI Endpoints

#### POST /ai/tasting-notes
Generate AI tasting notes.

**Request:**
```json
{
  "whiskey_id": 1,
  "user_notes": "sweet, oaky, little spicy",
  "mode": "expand"
}
```

Mode options:
- `suggest`: Generate suggested notes before tasting
- `expand`: Expand user's brief notes into full description

**Response (200):**
```json
{
  "notes": "Rich vanilla and caramel sweetness upfront, transitioning to toasted oak with hints of baking spice and white pepper on the finish. The mouthfeel is medium-bodied with a pleasant oiliness...",
  "flavor_tags": ["vanilla", "caramel", "oak", "baking spice", "white pepper"]
}
```

**Errors:**
- 500: API key not configured
- 429: Rate limited

---

### Flight Endpoints

#### GET /flights
Get user's tasting flights.

#### POST /flights
Create new flight.

#### GET /flights/:id
Get flight with whiskeys.

#### PUT /flights/:id
Update flight.

#### DELETE /flights/:id
Delete flight.

#### POST /flights/:id/whiskeys
Add whiskey to flight.

#### DELETE /flights/:id/whiskeys/:whiskey_id
Remove whiskey from flight.

---

### Blind Tasting Endpoints

#### GET /blind-tastings
Get user's blind tastings.

#### POST /blind-tastings
Create new blind tasting.

#### GET /blind-tastings/:id
Get blind tasting (respects reveal state).

#### POST /blind-tastings/:id/reveal
Reveal the blind tasting.

#### POST /blind-tastings/:id/samples/:sample_id/rate
Rate a sample.

---

### Profile Endpoints

#### GET /profile
Get current user's profile.

#### PUT /profile
Update profile settings.

#### GET /u/:slug
Get public profile (if is_public = true).

---

## Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {
      "field": "Specific field error"
    }
  }
}
```

## Rate Limiting

- General: 100 requests/minute
- AI endpoints: 10 requests/minute
- Auth endpoints: 5 requests/minute

Returns 429 with `Retry-After` header when exceeded.
