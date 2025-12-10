const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { body, query, param, validationResult } = require('express-validator');

dotenv.config();

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change-me';
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173,http://localhost:3000,http://localhost:5176,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:5176')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '@illinois.edu')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOCALHOST_PORTS = ['5173', '5176', '3000'];
const DISABLE_EMAIL_VERIFICATION = (process.env.DISABLE_EMAIL_VERIFICATION || '').toLowerCase() === 'true';

// Emails that require OTP verification
const EMAILS_REQUIRING_OTP = [
  'sgadi5@illinois.edu',
  'priyams3@illinois.edu',
  'nhari7@illinois.edu',
  'mns9@illinois.edu',
  'muthigi2@illinois.edu',
].map((e) => e.toLowerCase());

function requiresEmailVerification(email) {
  return EMAILS_REQUIRING_OTP.includes(email.toLowerCase());
}
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_FROM = process.env.SMTP_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required. Add it to a .env file.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function sendValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie('cb_jwt', token, {
    httpOnly: true,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    secure: IS_PRODUCTION,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  res.clearCookie('cb_jwt', {
    httpOnly: true,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    secure: IS_PRODUCTION,
  });
}
function assertAllowedEmailDomain(value) {
  const allowed = ALLOWED_EMAIL_DOMAINS.some((domain) => value.toLowerCase().endsWith(domain));
  if (!allowed) {
    throw new Error(`email must end with ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
  }
  return true;
}


const initialListings = [
  {
    title: 'Calculus Textbook - Excellent Condition',
    price: 45.0,
    description:
      'Used for Math 220. Barely any highlighting, all pages intact. Perfect for next semester!',
    category: 'Textbooks',
    image:
      'https://images.unsplash.com/photo-1761546571631-a4d61b55cd2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMGRlc2t8ZW58MXx8fHwxNzYyNzg4MjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Sarah Chen',
  },
  {
    title: 'Mountain Bike - Great for Campus',
    price: 180.0,
    description:
      '21-speed bike in good condition. Perfect for getting around campus and bike trails. Includes lock and lights.',
    category: 'Sports',
    image:
      'https://images.unsplash.com/photo-1724047314116-de588bcd8c8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWtlJTIwYmljeWNsZXxlbnwxfHx8fDE3NjI3ODgyNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Mike Johnson',
  },
  {
    title: 'Modern Desk Lamp',
    price: 25.0,
    description:
      'Adjustable LED desk lamp with multiple brightness settings. Perfect for late-night study sessions.',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1621447980929-6638614633c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwbGFtcHxlbnwxfHx8fDE3NjI3Mjg3NTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Emily Davis',
  },
  {
    title: 'Mini Fridge - Like New',
    price: 75.0,
    description:
      'Compact mini fridge, perfect for dorm rooms. Only used for one semester. Clean and works perfectly.',
    category: 'Furniture',
    image:
      'https://images.unsplash.com/photo-1540961403310-79825242906e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pJTIwZnJpZGdlfGVufDF8fHx8MTc2MjcxNzU0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Alex Martinez',
  },
  {
    title: 'Cozy Study Couch',
    price: 200.0,
    description:
      'Comfortable 2-seater couch, great condition. Moving out and need to sell. Smoke-free apartment.',
    category: 'Furniture',
    image:
      'https://images.unsplash.com/photo-1658946376154-b851ddd94623?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VjaCUyMGZ1cm5pdHVyZXxlbnwxfHx8fDE3NjI3ODgyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Ryan Taylor',
  },
  {
    title: 'Winter Jacket - Columbia',
    price: 60.0,
    description:
      'Columbia winter jacket, size M. Warm and waterproof. Perfect for Illinois winters. Only worn one season.',
    category: 'Clothing',
    image:
      'https://images.unsplash.com/photo-1706765779494-2705542ebe74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW50ZXIlMjBqYWNrZXR8ZW58MXx8fHwxNzYyNjc1MjYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    seller: 'Ryan Taylor',
  },
];

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      seller TEXT NOT NULL,
      owner_id INTEGER,
      location TEXT DEFAULT '',
      is_sold BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (user_id, listing_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      items_sold_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_ratings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  // Migration: Add listing_id column if it doesn't exist
  await pool.query(`
    ALTER TABLE user_ratings
    ADD COLUMN IF NOT EXISTS listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE;
  `);

  // Migration: Drop old unique constraint if it exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_ratings_user_id_rater_id_key'
      ) THEN
        ALTER TABLE user_ratings DROP CONSTRAINT user_ratings_user_id_rater_id_key;
      END IF;
    END $$;
  `);

  // Migration: Clean up any ratings without listing_id (they're invalid under new schema)
  await pool.query(`
    DELETE FROM user_ratings WHERE listing_id IS NULL;
  `);

  // Migration: Make listing_id NOT NULL after cleanup
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_ratings' 
        AND column_name = 'listing_id' 
        AND is_nullable = 'YES'
      ) THEN
        ALTER TABLE user_ratings ALTER COLUMN listing_id SET NOT NULL;
      END IF;
    END $$;
  `);

  // Migration: Add new unique constraint on (listing_id, rater_id) if it doesn't exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_ratings_listing_id_rater_id_key'
      ) THEN
        ALTER TABLE user_ratings ADD CONSTRAINT user_ratings_listing_id_rater_id_key
        UNIQUE (listing_id, rater_id);
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      confirmed_at TIMESTAMP WITH TIME ZONE,
      UNIQUE (listing_id, buyer_id)
    );
  `);

  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS owner_id INTEGER;
  `);

  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS purchase_id INTEGER REFERENCES purchases(id);
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS items_sold_count INTEGER DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name TEXT;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_code_hash TEXT;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;
  `);

  await pool.query(`
    UPDATE users SET email_verified = TRUE WHERE verification_code_hash IS NULL;
  `);

  await pool.query(`
    ALTER TABLE wishlist
    ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
  `);

  await pool.query(`
    UPDATE users u
    SET name = (
      SELECT DISTINCT seller
      FROM listings l
      WHERE l.owner_id = u.id
      LIMIT 1
    )
    WHERE u.name IS NULL
    AND EXISTS (SELECT 1 FROM listings WHERE owner_id = u.id);
  `);
}

async function ensureSellerHasAccount(sellerName) {
  // Generate email from seller name (e.g., "Sarah Chen" -> "sarahchen@illinois.edu")
  const emailBase = sellerName.toLowerCase().replace(/\s+/g, '');
  const email = `${emailBase}@illinois.edu`;
  
  // Check if user already exists
  let user = await getUserByEmail(email);
  if (!user) {
    // Create a dummy password hash for seed users (they can't log in, but have profiles)
    const dummyPasswordHash = await bcrypt.hash('seed-user-' + emailBase, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, TRUE) RETURNING id`,
      [email, dummyPasswordHash]
    );
    user = { id: rows[0].id };
  }
  return user.id;
}

async function seedInitialData() {
  const existingCount = await pool.query('SELECT COUNT(*) FROM listings');
  const count = parseInt(existingCount.rows[0]?.count ?? '0', 10);

  if (count > 0) {
    const { rows: listingsWithoutOwner } = await pool.query(
      'SELECT DISTINCT seller FROM listings WHERE owner_id IS NULL'
    );
    
    for (const row of listingsWithoutOwner) {
      const ownerId = await ensureSellerHasAccount(row.seller);
      await pool.query(
        'UPDATE listings SET owner_id = $1 WHERE seller = $2 AND owner_id IS NULL',
        [ownerId, row.seller]
      );
    }
    
    if (listingsWithoutOwner.length > 0) {
      console.log(`Backfilled owner_id for ${listingsWithoutOwner.length} sellers`);
    }
    return;
  }

  // Create a map to track seller names to user IDs
  const sellerUserMap = new Map();

  // First, create user accounts for each unique seller
  for (const listing of initialListings) {
    if (!sellerUserMap.has(listing.seller)) {
      const ownerId = await ensureSellerHasAccount(listing.seller);
      sellerUserMap.set(listing.seller, ownerId);
    }
  }

  // Now create listings with owner_id
  for (const listing of initialListings) {
    const ownerId = sellerUserMap.get(listing.seller);
    await pool.query(
      `
        INSERT INTO listings (title, description, price, category, image_url, seller, owner_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [listing.title, listing.description, listing.price, listing.category, listing.image, listing.seller, ownerId]
    );
  }

  console.log('Seeded listings and user accounts into Postgres');
}


function mapListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    image: row.image_url,
    seller: row.seller,
    isSold: row.is_sold || false,
    location: row.location || '',
    ownerId: row.owner_id || null,
    createdAt: row.created_at,
  };
}

const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  if (!RESEND_API_KEY) {
    throw new Error('Email sending is not configured. Set RESEND_API_KEY and SMTP_FROM/FROM_EMAIL.');
  }

  const subject = 'Campus Bazaar Email Verification';
  const text = `Your verification code is ${code}. It expires in 15 minutes.`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: SMTP_FROM,
      to: email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to send verification email: ${response.status} ${body}`);
  }
}

async function issueVerificationCode(userId, email) {
  if (DISABLE_EMAIL_VERIFICATION) {
    return { code: null, expiresAt: null };
  }

  const code = generateVerificationCode();
  const hash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  await pool.query(
    `UPDATE users SET verification_code_hash = $1, verification_expires_at = $2 WHERE id = $3`,
    [hash, expiresAt, userId]
  );

  await sendVerificationEmail(email, code);

  return { code, expiresAt };
}

async function getUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function getUserById(id) {
  const { rows } = await pool.query(
    `
      SELECT
        u.id,
        u.email,
        u.email_verified,
        u.name,
        u.created_at,
        u.items_sold_count,
        u.location,
        COALESCE(AVG(r.rating), 0)::float AS average_rating,
        COUNT(r.id) AS rating_count
      FROM users u
      LEFT JOIN user_ratings r ON r.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.email_verified, u.name, u.created_at, u.items_sold_count, u.location
    `,
    [id]
  );
  return rows[0] || null;
}

async function getListingById(id) {
  const { rows } = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
  return rows[0] || null;
}

function requireAuth(req, res, next) {
  const token = req.cookies?.cb_jwt;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    const normalized = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
    if (FRONTEND_ORIGINS.includes(normalized)) return true;
    const host = url.hostname;
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    if ((host === 'localhost' || host === '127.0.0.1' || host === '[::1]') && LOCALHOST_PORTS.includes(port)) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!IS_PRODUCTION) return callback(null, true); // allow all in dev
      if (!origin) return callback(null, true); // allow same-origin or curl
      const allowed = isAllowedOrigin(origin);
      if (allowed) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const emailRule = body('email')
  .isEmail()
  .withMessage('email is invalid')
  .bail()
  .custom(assertAllowedEmailDomain)
  .customSanitizer((value) => value.toLowerCase());
const passwordRule = body('password').isLength({ min: 8 }).withMessage('password must be at least 8 chars');

app.post(
  '/api/auth/signup',
  emailRule,
  passwordRule,
  body('name').optional().isString().isLength({ min: 1 }).withMessage('name must be at least 1 character'),
  sendValidationErrors,
  async (req, res) => {
    const { email, password, name } = req.body ?? {};

    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const emailLower = email.toLowerCase();
      
      // Check if this email requires OTP verification
      const needsVerification = requiresEmailVerification(emailLower) && !DISABLE_EMAIL_VERIFICATION;
      
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, name, email_verified, verification_code_hash, verification_expires_at)
         VALUES ($1, $2, $3, $4, NULL, NULL)
         RETURNING id, email`,
        [emailLower, passwordHash, name?.trim() || null, !needsVerification]
      );

      // If email doesn't require verification, sign them up directly
      if (!needsVerification) {
        const token = signToken(rows[0].id);
        setAuthCookie(res, token);
        const user = await getUserById(rows[0].id);
        return res.status(201).json(user);
      }

      // For emails requiring verification, send OTP
      await issueVerificationCode(rows[0].id, rows[0].email);

      res.status(201).json({
        requiresVerification: true,
        email: rows[0].email,
        message: 'Verification code sent to your email',
      });
    } catch (error) {
      console.error('Error during signup', error);
      res.status(500).json({ error: 'Failed to sign up' });
    }
  }
);

app.post(
  '/api/auth/verify-email',
  emailRule,
  body('code').isLength({ min: 6, max: 6 }).withMessage('code must be 6 digits'),
  sendValidationErrors,
  async (req, res) => {
    if (DISABLE_EMAIL_VERIFICATION) {
      return res.status(400).json({ error: 'Email verification is disabled' });
    }
    const { email, code } = req.body ?? {};

    try {
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.email_verified) {
        const token = signToken(user.id);
        setAuthCookie(res, token);
        const profile = await getUserById(user.id);
        return res.json(profile);
      }

      if (!user.verification_code_hash || !user.verification_expires_at) {
        return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
      }

      const expiresAt = new Date(user.verification_expires_at);
      if (expiresAt.getTime() < Date.now()) {
        return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
      }

      const isMatch = await bcrypt.compare(code, user.verification_code_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      await pool.query(
        `UPDATE users SET email_verified = TRUE, verification_code_hash = NULL, verification_expires_at = NULL WHERE id = $1`,
        [user.id]
      );

      const token = signToken(user.id);
      setAuthCookie(res, token);
      const profile = await getUserById(user.id);
      res.json(profile);
    } catch (error) {
      console.error('Error verifying email', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
);

app.post(
  '/api/auth/resend-verification',
  emailRule,
  sendValidationErrors,
  async (req, res) => {
    if (DISABLE_EMAIL_VERIFICATION) {
      return res.status(400).json({ error: 'Email verification is disabled' });
    }
    const { email } = req.body ?? {};

    try {
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'No account found for this email' });
      }
      if (user.email_verified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      await issueVerificationCode(user.id, user.email);

      res.json({
        message: 'Verification code resent',
        email: user.email,
        requiresVerification: true,
      });
    } catch (error) {
      console.error('Error resending verification code', error);
      res.status(500).json({ error: 'Failed to resend verification code' });
    }
  }
);

app.post('/api/auth/login', emailRule, passwordRule, sendValidationErrors, async (req, res) => {
  const { email, password } = req.body ?? {};

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only require verification for emails in the OTP list
    const needsVerification = requiresEmailVerification(user.email) && !DISABLE_EMAIL_VERIFICATION;
    if (!user.email_verified && needsVerification) {
      await issueVerificationCode(user.id, user.email);
      return res.status(403).json({
        error: 'Email not verified. We sent you a verification code.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);
    const profile = await getUserById(user.id);
    res.json(profile);
  } catch (error) {
    console.error('Error during login', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await getUserById(req.userId);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(user);
});

const listingFilters = [
  query('q').optional().isString(),
  query('category').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('location').optional().isString(),
  query('includeSold').optional().isBoolean(),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'oldest']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const listingBodyRules = [
  body('title').isString().isLength({ min: 2 }),
  body('description').isString().isLength({ min: 2 }),
  body('price').isFloat({ min: 0 }),
  body('category').isString().isLength({ min: 2 }),
  body('image').optional().isString(),
  body('location').optional().isString(),
];

app.get('/api/listings', listingFilters, sendValidationErrors, async (req, res) => {
  const { q, category, minPrice, maxPrice, location, includeSold, sort, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (minPrice) {
    values.push(minPrice);
    conditions.push(`price >= $${values.length}`);
  }
  if (maxPrice) {
    values.push(maxPrice);
    conditions.push(`price <= $${values.length}`);
  }
  if (location) {
    values.push(`%${location}%`);
    conditions.push(`location ILIKE $${values.length}`);
  }
  if (!includeSold || includeSold === 'false') {
    conditions.push(`is_sold = FALSE`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  let orderBy = 'ORDER BY created_at DESC';
  if (sort === 'price_asc') orderBy = 'ORDER BY price ASC';
  else if (sort === 'price_desc') orderBy = 'ORDER BY price DESC';
  else if (sort === 'oldest') orderBy = 'ORDER BY created_at ASC';

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  try {
    // Join with purchases to get status
    const query = `
      SELECT 
        l.*,
        p.status as purchase_status,
        p.buyer_id as purchase_buyer_id
      FROM listings l
      LEFT JOIN purchases p ON p.listing_id = l.id AND p.status = 'pending'
      ${whereClause}
      ${orderBy}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const { rows } = await pool.query(query, [...values, limitNum, offset]);
    res.json(rows.map((row) => ({
      ...mapListing(row),
      purchaseStatus: row.purchase_status || null,
      purchaseBuyerId: row.purchase_buyer_id || null,
    })));
  } catch (error) {
    console.error('Error fetching listings', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.get('/api/listings/:id', param('id').isInt(), sendValidationErrors, async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Listing not found' });
  res.json(mapListing(rows[0]));
});

app.post('/api/listings', requireAuth, listingBodyRules, sendValidationErrors, async (req, res) => {
  const { title, description, price, category, image, seller, location } = req.body ?? {};
  const parsedPrice = Number(price);
  const imageUrl =
    image ||
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
  const sellerName = seller || 'You';

  try {
    const { rows } = await pool.query(
      `
        INSERT INTO listings (title, description, price, category, image_url, seller, owner_id, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [title, description, parsedPrice, category, imageUrl, sellerName, req.userId, location || '']
    );

    res.status(201).json(mapListing(rows[0]));
  } catch (error) {
    console.error('Error creating listing', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

app.put(
  '/api/listings/:id',
  requireAuth,
  param('id').isInt(),
  [
    body('title').optional().isString().isLength({ min: 2 }),
    body('description').optional().isString().isLength({ min: 2 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isString().isLength({ min: 2 }),
    body('image').optional().isString(),
    body('location').optional().isString(),
  ],
  sendValidationErrors,
  async (req, res) => {
    const id = Number(req.params.id);
    const { title, description, price, category, image, location } = req.body ?? {};

    const { rows: existingRows } = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (!existingRows[0]) return res.status(404).json({ error: 'Listing not found' });
    if (existingRows[0].owner_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const next = {
      title: title ?? existingRows[0].title,
      description: description ?? existingRows[0].description,
      price: price ?? existingRows[0].price,
      category: category ?? existingRows[0].category,
      image_url: image ?? existingRows[0].image_url,
      location: location ?? existingRows[0].location,
    };

    const { rows } = await pool.query(
      `
        UPDATE listings
        SET title = $1, description = $2, price = $3, category = $4, image_url = $5, location = $6
        WHERE id = $7
        RETURNING *
      `,
      [next.title, next.description, next.price, next.category, next.image_url, next.location, id]
    );

    res.json(mapListing(rows[0]));
  }
);

app.delete('/api/listings/:id', requireAuth, param('id').isInt(), sendValidationErrors, async (req, res) => {
  const listingId = Number(req.params.id);
  try {
    const result = await pool.query('DELETE FROM listings WHERE id = $1 AND owner_id = $2', [
      listingId,
      req.userId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Listing not found or not owned by user' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting listing', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

app.post(
  '/api/listings/:id/mark-sold',
  requireAuth,
  param('id').isInt(),
  body('buyer_id').isInt().withMessage('buyer_id must be an integer'),
  sendValidationErrors,
  async (req, res) => {
    const listingId = Number(req.params.id);
    const { buyer_id } = req.body ?? {};
    const listing = await getListingById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.owner_id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (listing.is_sold) return res.status(400).json({ error: 'Listing already sold' });

    try {
      // Check if buyer exists
      const buyer = await getUserById(buyer_id);
      if (!buyer) return res.status(404).json({ error: 'Buyer not found' });

      // Create purchase record
      const { rows: purchaseRows } = await pool.query(
        `
          INSERT INTO purchases (listing_id, buyer_id, seller_id, status)
          VALUES ($1, $2, $3, 'pending')
          ON CONFLICT (listing_id, buyer_id) DO UPDATE SET status = 'pending', created_at = now()
          RETURNING *
        `,
        [listingId, buyer_id, req.userId]
      );

      // Update listing with purchase_id
      await pool.query(
        `UPDATE listings SET purchase_id = $1 WHERE id = $2`,
        [purchaseRows[0].id, listingId]
      );

      res.json({
        listing: mapListing(listing),
        purchase: purchaseRows[0],
        message: 'Purchase pending buyer confirmation',
      });
    } catch (error) {
      console.error('Error marking listing sold', error);
      res.status(500).json({ error: 'Failed to mark sold' });
    }
  }
);

app.post(
  '/api/listings/:id/contact',
  requireAuth,
  param('id').isInt(),
  sendValidationErrors,
  async (req, res) => {
    const listingId = Number(req.params.id);
    const listing = await getListingById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (!listing.owner_id) {
      return res.status(400).json({ error: 'Seller has no contact email for this listing yet' });
    }

    const seller = await getUserById(listing.owner_id);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    const subject = `Inquiry about ${listing.title}`;
    const mailto = `mailto:${seller.email}?subject=${encodeURIComponent(subject)}`;

    res.json({
      listingId,
      sellerId: seller.id,
      sellerEmail: seller.email,
      mailto,
    });
  }
);

app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT listing_id FROM wishlist WHERE user_id = $1', [req.userId]);
    const wishlistIds = rows.map((row) => row.listing_id);
    res.json(wishlistIds);
  } catch (error) {
    console.error('Error fetching wishlist', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.post('/api/wishlist/:id', requireAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  if (Number.isNaN(listingId)) {
    return res.status(400).json({ error: 'Invalid listing id' });
  }

  try {
    await pool.query(
      `
        INSERT INTO wishlist (user_id, listing_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [req.userId, listingId]
    );
    res.status(204).send();
  } catch (error) {
    console.error('Error adding to wishlist', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.delete('/api/wishlist/:id', requireAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  if (Number.isNaN(listingId)) {
    return res.status(400).json({ error: 'Invalid listing id' });
  }

  try {
    await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND listing_id = $2', [req.userId, listingId]);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing from wishlist', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

app.get('/api/users/search', requireAuth, query('q').isString().isLength({ min: 1 }), sendValidationErrors, async (req, res) => {
  const queryTerm = `%${req.query.q}%`;
  try {
    const { rows } = await pool.query(
      `
        SELECT id, email, name
        FROM users
        WHERE (email ILIKE $1 OR name ILIKE $1)
        AND id != $2
        ORDER BY name NULLS LAST, email
        LIMIT 20
      `,
      [queryTerm, req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error searching users', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

app.get('/api/users/:id', param('id').isInt(), sendValidationErrors, async (req, res) => {
  const userId = Number(req.params.id);
  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put(
  '/api/users/:id',
  requireAuth,
  param('id').isInt(),
  body('location').optional().isString(),
  body('name').optional().isString().isLength({ min: 1 }).withMessage('name must be at least 1 character'),
  sendValidationErrors,
  async (req, res) => {
    const userId = Number(req.params.id);
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { location, name } = req.body ?? {};
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (location !== undefined) {
        updates.push(`location = $${paramIndex}`);
        values.push(location || '');
        paramIndex++;
      }
      
      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(name?.trim() || null);
        paramIndex++;
      }
      
      if (updates.length > 0) {
        values.push(userId);
        await pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
      
      const updated = await getUserById(userId);
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating user profile', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

app.post(
  '/api/users/:id/ratings',
  requireAuth,
  [
    param('id').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('listing_id').isInt().withMessage('Listing ID is required'),
    body('comment').optional().isString(),
  ],
  sendValidationErrors,
  async (req, res) => {
    const userId = Number(req.params.id);
    const { rating, listing_id, comment } = req.body ?? {};

    if (userId === req.userId) {
      return res.status(400).json({ error: 'You cannot rate yourself' });
    }

    const exists = await getUserById(userId);
    if (!exists) return res.status(404).json({ error: 'User not found' });

    // Verify the listing belongs to the user being rated
    const listing = await getListingById(listing_id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.owner_id !== userId) {
      return res.status(400).json({ error: 'Listing does not belong to this user' });
    }

    try {
      await pool.query(
        `
          INSERT INTO user_ratings (user_id, rater_id, listing_id, rating, comment)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (listing_id, rater_id)
          DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
        `,
        [userId, req.userId, listing_id, rating, comment || '']
      );

      const profile = await getUserById(userId);
      res.status(201).json({
        userId,
        average_rating: profile.average_rating,
        rating_count: profile.rating_count,
        items_sold_count: profile.items_sold_count,
      });
    } catch (error) {
      console.error('Error saving rating', error);
      res.status(500).json({ error: 'Failed to save rating' });
    }
  }
);

app.get(
  '/api/users/:id/listings',
  [param('id').isInt(), query('sold').optional().isBoolean()],
  sendValidationErrors,
  async (req, res) => {
    const userId = Number(req.params.id);
    const sold = req.query.sold;
    const conditions = ['owner_id = $1'];
    const values = [userId];
    if (sold === 'true') conditions.push('is_sold = TRUE');
    if (sold === 'false') conditions.push('is_sold = FALSE');
    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await pool.query(`SELECT * FROM listings ${where} ORDER BY created_at DESC`, values);
    res.json(rows.map(mapListing));
  }
);

app.get('/api/purchases', requireAuth, async (req, res) => {
  console.log('GET /api/purchases called, userId:', req.userId);
  try {
    const { rows } = await pool.query(
      `
        SELECT 
          p.*,
          l.id as listing_id,
          l.title,
          l.description,
          l.price,
          l.category,
          l.image_url,
          l.seller,
          l.location,
          l.is_sold,
          l.owner_id,
          l.created_at as listing_created_at,
          u_seller.name as seller_name,
          u_seller.email as seller_email
        FROM purchases p
        JOIN listings l ON l.id = p.listing_id
        JOIN users u_seller ON u_seller.id = p.seller_id
        WHERE p.buyer_id = $1
        ORDER BY p.created_at DESC
      `,
      [req.userId]
    );
    res.json(rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      status: row.status,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at,
      listing: mapListing({
        id: row.listing_id,
        title: row.title,
        description: row.description,
        price: row.price,
        category: row.category,
        image_url: row.image_url,
        seller: row.seller_name || row.seller,
        location: row.location,
        is_sold: row.is_sold,
        owner_id: row.owner_id,
        created_at: row.listing_created_at,
      }),
      sellerName: row.seller_name,
      sellerEmail: row.seller_email,
    })));
  } catch (error) {
    console.error('Error fetching purchases', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

app.post(
  '/api/purchases/:id/confirm',
  requireAuth,
  param('id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating is required and must be between 1 and 5'),
  sendValidationErrors,
  async (req, res) => {
    const purchaseId = Number(req.params.id);
    const { rating } = req.body ?? {};

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
    }

    try {
      // Get purchase
      const { rows: purchaseRows } = await pool.query(
        'SELECT * FROM purchases WHERE id = $1 AND buyer_id = $2',
        [purchaseId, req.userId]
      );
      if (!purchaseRows[0]) return res.status(404).json({ error: 'Purchase not found' });
      if (purchaseRows[0].status !== 'pending') {
        return res.status(400).json({ error: 'Purchase already confirmed or cancelled' });
      }

      // Update purchase status
      await pool.query(
        `UPDATE purchases SET status = 'confirmed', confirmed_at = now() WHERE id = $1`,
        [purchaseId]
      );

      // Mark listing as sold
      await pool.query(
        `UPDATE listings SET is_sold = TRUE WHERE id = $1`,
        [purchaseRows[0].listing_id]
      );

      // Increment seller's items_sold_count
      await pool.query(
        `UPDATE users SET items_sold_count = items_sold_count + 1 WHERE id = $1`,
        [purchaseRows[0].seller_id]
      );

      // Add rating (now required) - tied to the specific listing/product
      await pool.query(
        `
          INSERT INTO user_ratings (user_id, rater_id, listing_id, rating, comment)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (listing_id, rater_id)
          DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
        `,
        [purchaseRows[0].seller_id, req.userId, purchaseRows[0].listing_id, rating, '']
      );

      res.json({ message: 'Purchase confirmed successfully' });
    } catch (error) {
      console.error('Error confirming purchase', error);
      res.status(500).json({ error: 'Failed to confirm purchase' });
    }
  }
);

app.post(
  '/api/purchases/:id/cancel',
  requireAuth,
  param('id').isInt(),
  sendValidationErrors,
  async (req, res) => {
    const purchaseId = Number(req.params.id);

    try {
      // Get purchase
      const { rows: purchaseRows } = await pool.query(
        'SELECT * FROM purchases WHERE id = $1 AND buyer_id = $2',
        [purchaseId, req.userId]
      );
      if (!purchaseRows[0]) return res.status(404).json({ error: 'Purchase not found' });
      if (purchaseRows[0].status !== 'pending') {
        return res.status(400).json({ error: 'Purchase already confirmed or cancelled' });
      }

      // Clear purchase_id from listing FIRST (before deleting purchase to avoid FK constraint)
      // This makes the listing available again for the seller to mark as sold
      const listingId = purchaseRows[0].listing_id;
      
      // Use a transaction to ensure both operations succeed
      await pool.query('BEGIN');
      try {
        await pool.query(
          `UPDATE listings SET purchase_id = NULL, is_sold = FALSE WHERE id = $1`,
          [listingId]
        );
        
        // Delete the purchase record (cancelled)
        await pool.query('DELETE FROM purchases WHERE id = $1', [purchaseId]);
        
        await pool.query('COMMIT');
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }

      res.json({ message: 'Purchase cancelled successfully. The item is available again for the seller.' });
    } catch (error) {
      console.error('Error cancelling purchase', error);
      res.status(500).json({ error: 'Failed to cancel purchase' });
    }
  }
);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

ensureSchema()
  .then(seedInitialData)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
