export type FieldType = 'text' | 'textarea' | 'list' | 'number' | 'date';

export type DocField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  default?: string;
};

export type DocConfig = {
  type: string;
  label: string;
  description: string;
  fields: DocField[];
};

// "list" fields are edited as one line per item in a textarea, and split into
// an array of strings before sending. Defaults mirror lib/pdfTemplates.js so
// the form starts pre-filled with the same copy the PDF would otherwise fall
// back to, ready for the admin to tweak before sending.

export const DOC_CONFIGS: DocConfig[] = [
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
      { key: 'title', label: 'Agreement title', type: 'text', default: 'Landing Page Service Agreement' },
      { key: 'fee', label: 'Agreed project fee', type: 'text', default: 'PKR 5,000' },
      {
        key: 'scope', label: 'Scope of work (one item per line)', type: 'list', default:
`Production and editing of ONE short-form video advertisement.
Delivered for Instagram, TikTok, LinkedIn, Google Ads and YouTube using one agreed master format.
Includes cinematic editing, transitions, motion graphics, captions/text overlays, logo/brand placement, sound design, and music as appropriate to the approved concept.
Up to two reasonable revision rounds are included after demo approval.`,
      },
      {
        key: 'exclusions', label: 'Not included (one item per line)', type: 'list', default:
`Advertising spend, media buying, campaign setup or performance guarantees.
On-site filming, travel, actors or physical production unless separately agreed.
Paid stock footage, premium music/plugins or third-party licence costs.
Ongoing monthly content creation or account management unless separately quoted.`,
      },
    ],
  },
  {
    type: 'invoice',
    label: 'Invoice',
    description: 'Itemized invoice with a total and due date.',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice #', type: 'text', default: '0001' },
      { key: 'amount', label: 'Amount (PKR)', type: 'number', default: '5000' },
      { key: 'project', label: 'Project / description', type: 'text', default: 'Landing Page Service Agreement' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      { key: 'paymentInstructions', label: 'Payment instructions', type: 'textarea', default: 'Payment via bank transfer / JazzCash / Easypaisa — details to be shared separately. Final files are released after full payment.' },
    ],
  },
  {
    type: 'access_request',
    label: 'Access Request',
    description: 'Ask for assets, logins or info.',
    fields: [
      {
        key: 'items', label: 'Requested items (one per line)', type: 'list', default:
`Logo files and brand assets (PNG/SVG, high resolution).
Any client-owned photos or video to be used in the ad.
Ad account access via official invite (not password sharing), if applicable.
Confirmation of offer wording / claims to be used in the advert.`,
      },
    ],
  },
  {
    type: 'monthly_report',
    label: 'Monthly Report',
    description: 'Progress update for this month.',
    fields: [
      { key: 'month', label: 'Month', type: 'text', default: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }) },
      { key: 'summary', label: 'Summary', type: 'textarea', default: "Here's a summary of the work completed this month and what's planned next." },
      { key: 'completed', label: 'Completed this month (one per line)', type: 'list', default: 'Demo concept delivered and reviewed.\nRevision round completed.' },
      { key: 'planned', label: 'Planned next (one per line)', type: 'list', default: 'Finalize export and handover files.' },
    ],
  },
  {
    type: 'fulfillment',
    label: 'Fulfillment Doc',
    description: 'Confirms delivery & handover.',
    fields: [
      { key: 'summary', label: 'Summary', type: 'textarea', default: 'This confirms that the agreed deliverables for your project have been completed and handed over.' },
      { key: 'delivered', label: 'Delivered (one per line)', type: 'list', default: 'Final approved video export.\nSource/agreed project files for this engagement.' },
    ],
  },
  {
    type: 'feedback_request',
    label: 'Feedback Request',
    description: 'Ask the client for feedback.',
    fields: [
      { key: 'message', label: 'Message', type: 'textarea', default: "We'd appreciate a few minutes of your time to share feedback on the work delivered so far." },
      {
        key: 'questions', label: 'Questions (one per line)', type: 'list', default:
`How satisfied are you with the delivered concept? (1-5)
Was communication clear and timely throughout the project?
Anything you'd like us to improve next time?`,
      },
    ],
  },
];
