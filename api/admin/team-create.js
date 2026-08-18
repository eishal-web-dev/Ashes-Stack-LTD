import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import { getUserFromReq } from '../../lib/auth.js';
import { logActivity } from '../../lib/logActivity.js';

function isOwnerAdmin(user) {
  const allowed = (process.env.ADMIN_EMAILS || 'admin@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return user?.role === 'admin' && allowed.includes((user.email || '').toLowerCase());
}

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!isOwnerAdmin(authUser)) return res.status(403).json({ error: 'Owner admin only' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();

  const {
    name, email, password, teamTitle, department, startedAt,
    salaryAmount, salaryCurrency, salaryFrequency,
    appointmentLetterTitle, appointmentLetterUrl,
  } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  const cleanEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: cleanEmail })) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = await User.create({
    name,
    email: cleanEmail,
    password: await bcrypt.hash(password, 10),
    role: 'team',
    teamTitle: teamTitle || 'Team Member',
    department: department || 'Delivery',
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    salaryAmount: Number(salaryAmount) || undefined,
    salaryCurrency: salaryCurrency || 'PKR',
    salaryFrequency: salaryFrequency || 'monthly',
    appointmentLetterTitle: appointmentLetterTitle || 'Appointment Letter',
    appointmentLetterUrl: appointmentLetterUrl || undefined,
    company: 'ASHES',
    project: 'Internal team workspace',
  });

  await logActivity(user._id, 'account_created', { via: 'admin_panel', role: 'team' }, authUser.id);
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
}
