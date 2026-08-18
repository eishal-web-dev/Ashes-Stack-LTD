import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import DocRecord from '../../models/DocRecord.js';
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

  const latestLetter = await DocRecord.findOne({ client: user._id, type: 'appointment_letter' })
    .select('title status createdAt fileName')
    .sort({ createdAt: -1 });

  const data = user.toObject();
  if (latestLetter) {
    data.appointmentLetterTitle = latestLetter.title;
    data.appointmentLetterUrl = '/api/team/appointment-letter';
    data.appointmentLetterStatus = latestLetter.status;
    data.appointmentLetterSentAt = latestLetter.createdAt;
    data.appointmentLetterFileName = latestLetter.fileName;
  }
  res.status(200).json(data);
}
