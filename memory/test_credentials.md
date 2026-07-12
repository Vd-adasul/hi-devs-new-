# LawyerOS demo credentials

The mock backend accepts any email+password combination (demo-mode).
For a nice pre-populated experience use:

- Email:    `maya@lawyeros.ai`
- Password: `demo123`

You'll sign in as "Maya Goldberg, General Counsel" — the seeded admin
persona with a full workspace (22 contracts, 8 matters, 7 approvals, etc.).

Note: the demo backend (`/app/backend/server.py`) is a lightweight
FastAPI service that mimics the real Fastify API surface with seeded
data. It has no user database — every credential works.
