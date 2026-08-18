import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import { getUserFromReq } from '../../lib/auth.js';

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  await dbConnect();
  const team = await User.find({ role: 'team' })
    .select('name email teamTitle department availability createdAt')
    .sort({ createdAt: -1 });
  res.status(200).json(team);
}
