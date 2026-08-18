import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import { getUserFromReq } from '../../lib/auth.js';

function isOwnerAdmin(user) {
  const allowed = (process.env.ADMIN_EMAILS || 'admin@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return user?.role === 'admin' && allowed.includes((user.email || '').toLowerCase());
}

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!isOwnerAdmin(authUser)) return res.status(403).json({ error: 'Owner admin only' });
  await dbConnect();
  const team = await User.find({ role: 'team' })
    .select('name email teamTitle department availability employmentStatus startedAt salaryAmount salaryCurrency salaryFrequency appointmentLetterTitle appointmentLetterUrl createdAt')
    .sort({ createdAt: -1 });
  res.status(200).json(team);
}
