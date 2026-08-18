// Defines the editable fields shown to admin for each document type,
// mirroring the meta fields each template in lib/pdfTemplates.js actually reads.

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'lines' | 'paragraph';
  placeholder?: string;
};

export type DocTypeConfig = {
  type: string;
  label: string;
  description: string;
  fields: FieldDef[];
};

export const DOC_TYPES: DocTypeConfig[] = [
  {
    type: 'welcome',
    label: 'Welcome Doc',
    description: 'Onboarding packet for a new client.',
    fields: [
      { key: 'googleEmail', label: 'Gmail for Google Meet invites', type: 'text', placeholder: 'client@gmail.com' },
    ],
  },
  {
    type: 'contract',
    label: 'Contract',
    description: 'Service agreement based on your template.',
    fields: [
      { key: 'title', label: 'Agreement title', type: 'text', placeholder: 'Landing Page Service Agreement' },
      { key: 'fee', label: 'Agreed fee', type: 'text', placeholder: 'PKR 5,000' },
      { key: 'scope', label: 'Scope of work (one line per bullet)', type: 'lines' },
      { key: 'exclusions', label: 'Not included (one line per bullet)', type: 'lines' },
    ],
  },
  {
    type: 'invoice',
    label: 'Invoice',
    description: 'Itemized invoice with amount and due date.',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice #', type: 'text', placeholder: '0001' },
      { key: 'amount', label: 'Amount (PKR)', type: 'number', placeholder: '5000' },
      { key: 'project', label: 'Project / description', type: 'text', placeholder: 'Landing Page Service Agreement' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'service', label: 'Service category (for revenue-by-service reporting)', type: 'text', placeholder: 'Video Ads / Landing Page / 3D / Web App' },
      { key: 'cost', label: 'Project cost, optional (for margin/profit reporting)', type: 'number', placeholder: 'e.g. 1500' },
    ],
  },
  {
    type: 'access_request',
    label: 'Access Request',
    description: 'Ask for assets, logins or info.',
    fields: [
      { key: 'items', label: 'Requested items (one line per bullet)', type: 'lines' },
    ],
  },
  {
    type: 'monthly_report',
    label: 'Monthly Report',
    description: 'Progress update for this month.',
    fields: [
      { key: 'month', label: 'Month', type: 'text', placeholder: 'August 2026' },
      { key: 'summary', label: 'Summary', type: 'paragraph' },
      { key: 'completed', label: 'Completed this month (one line per bullet)', type: 'lines' },
      { key: 'planned', label: 'Planned next (one line per bullet)', type: 'lines' },
    ],
  },
  {
    type: 'fulfillment',
    label: 'Fulfillment Doc',
    description: 'Confirms delivery & handover.',
    fields: [
      { key: 'summary', label: 'Summary', type: 'paragraph' },
      { key: 'delivered', label: 'What was delivered (one line per bullet)', type: 'lines' },
    ],
  },
  {
    type: 'feedback_request',
    label: 'Feedback Request',
    description: 'Ask the client for feedback.',
    fields: [
      { key: 'message', label: 'Message', type: 'paragraph' },
      { key: 'questions', label: 'Questions (one line per bullet)', type: 'lines' },
    ],
  },
];
