import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import { getUserFromReq } from '../../lib/auth.js';

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'team') return res.status(403).json({ error: 'Team only' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();

  const user = await User.findById(authUser.id).select(
    'name email phone teamTitle department availability employmentStatus startedAt salaryAmount salaryCurrency salaryFrequency appointmentLetterTitle appointmentLetterUrl teamTasks createdAt'
  );
  if (!user) return res.status(404).json({ error: 'Team member not found' });
  res.status(200).json(user);
}
