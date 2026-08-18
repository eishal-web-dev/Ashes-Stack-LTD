import { dbConnect } from '../../lib/mongodb.js';
import User from '../../models/User.js';
import DocRecord from '../../models/DocRecord.js';
import { getUserFromReq } from '../../lib/auth.js';
import { generateTeamAppointmentPdf } from '../../lib/teamAppointmentPdf.js';
import { logActivity } from '../../lib/logActivity.js';

export default async function handler(req, res) {
  const authUser = getUserFromReq(req);
  if (!authUser || authUser.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();

  try {
    const { teamId, meta = {} } = req.body || {};
    if (!teamId) return res.status(400).json({ error: 'teamId is required' });
    const team = await User.findOne({ _id: teamId, role: 'team' });
    if (!team) return res.status(404).json({ error: 'Team member not found' });

    const pdfBytes = await generateTeamAppointmentPdf(team, meta);
    const title = meta.documentTitle || `Appointment Letter · ${team.name}`;
    const fileName = `ASHES-Appointment-${team.name.replace(/[^a-z0-9]+/gi, '-')}.pdf`;
    const doc = await DocRecord.create({
      client: team._id,
      type: 'appointment_letter',
      title,
      meta,
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      mimeType: 'application/pdf',
      fileName,
      sentBy: authUser.id,
    });

    if (meta.title !== undefined) team.teamTitle = meta.title || team.teamTitle;
    if (meta.department !== undefined) team.department = meta.department || team.department;
    if (meta.startDate) team.startedAt = new Date(meta.startDate);
    if (meta.employmentStatus) team.employmentStatus = meta.employmentStatus;
    if (meta.salaryAmount !== undefined && meta.salaryAmount !== '') team.salaryAmount = Number(meta.salaryAmount) || 0;
    if (meta.salaryCurrency) team.salaryCurrency = meta.salaryCurrency;
    if (meta.salaryFrequency) team.salaryFrequency = meta.salaryFrequency;
    team.appointmentLetterTitle = title;
    team.appointmentLetterUrl = '/api/team/appointment-letter';
    await team.save();

    await logActivity(team._id, 'appointment_letter_sent', { title, documentId: doc._id }, authUser.id);
    res.status(201).json({ id: doc._id, title, fileName, sentAt: doc.createdAt });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Could not generate appointment letter' });
  }
}
