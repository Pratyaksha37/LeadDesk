import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './supabase.js';
import { createLeadSchema, updateLeadSchema } from './validation.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  supabase.auth.getUser(token)
    .then(({ data: { user }, error }) => {
      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = user;
      next();
    })
    .catch(() => res.status(401).json({ error: 'Unauthorized' }));
}

app.post('/api/leads', async (req, res) => {
  try {
    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, budgetRange, message } = parsed.data;

    const { data, error } = await supabase
      .from('leads')
      .insert({ name, email, budget_range: budgetRange, message, status: 'new' })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    res.status(201).json({ success: true, lead: data });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leads', isAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }

    const mapped = data.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      budgetRange: l.budget_range,
      message: l.message,
      status: l.status,
      createdAt: l.created_at,
    }));

    res.json({ leads: mapped, total: count ?? 0 });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leads/stats', isAuthenticated, async (req, res) => {
  try {
    const { data, error } = await supabase.from('leads').select('status');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    const total = data.length;
    const byStatus = { new: 0, contacted: 0, closed: 0 };
    data.forEach((l) => {
      if (byStatus[l.status] !== undefined) {
        byStatus[l.status]++;
      }
    });

    res.json({ total, byStatus });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { status: newStatus } = parsed.data;

    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(500).json({ error: 'Failed to update lead' });
    }

    res.json({
      success: true,
      lead: {
        id: data.id,
        name: data.name,
        email: data.email,
        budgetRange: data.budget_range,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/leads/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead ID' });
    }

    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete lead' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email and password (min 6 chars) required' });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Admin user created successfully', user: data.user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/me', isAuthenticated, async (req, res) => {
  res.json({ user: req.user });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/public'));
  app.get('*', (_req, res) => {
    res.sendFile('dist/public/index.html', { root: process.cwd() });
  });
}

app.listen(PORT, () => {
  console.log(`LeadDesk API server running on port ${PORT}`);
});
