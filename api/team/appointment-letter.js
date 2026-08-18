import { dbConnect } from '../../lib/mongodb.js';
import DocRecord from '../../models/DocRecord.js';
import { getUserFromReq } from '../../lib/auth.js';
import { getDocumentBuffer } from '../../lib/supabaseStorage.js';

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'team') return res.status(403).json({ error: 'Team only' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();

  const doc = await DocRecord.findOne({ client: authUser.id, type: 'appointment_letter' }).sort({ createdAt: -1 });
  if (!doc) return res.status(404).json({ error: 'Appointment letter not found' });

  if (doc.status !== 'downloaded') {
    doc.status = 'downloaded';
    await doc.save();
  }

  const bytes = await getDocumentBuffer(doc);
  res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.fileName || 'ASHES-Appointment-Letter.pdf'}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(bytes);
}
