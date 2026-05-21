import type { Lead } from '../types';

const people = [
  ['Priya', 'Shah', 'priya.shah@techcorp.io', 'TechCorp', 'linkedin', 'qualified'],
  ['Rohan', 'Kapoor', 'r.kapoor@venture.in', 'Venture.in', 'website', 'new'],
  ['Aisha', 'Mehta', 'aisha@growfast.co', 'GrowFast', 'cold_email', 'contacted'],
  ['Siddharth', 'Jain', 'sid@cloudsync.io', 'CloudSync', 'referral', 'converted'],
  ['Neha', 'Patel', 'neha.p@startup.in', 'StartupIn', 'event', 'lost'],
  ['Vikram', 'Rao', 'v.rao@scaleup.co', 'ScaleUp', 'linkedin', 'new'],
  ['Divya', 'Singh', 'divya@nextech.io', 'NexTech', 'instagram', 'pending'],
  ['Aryan', 'Bhatt', 'aryan@futurex.in', 'FutureX', 'website', 'qualified'],
  ['Maya', 'Desai', 'maya@brightlane.com', 'BrightLane', 'cold_call', 'contacted'],
  ['Kabir', 'Sethi', 'kabir@northstar.dev', 'NorthStar', 'referral', 'converted'],
  ['Sara', 'Ali', 'sara@meridiangrid.com', 'MeridianGrid', 'website', 'qualified'],
  ['Omar', 'Khan', 'omar@fluxframe.io', 'FluxFrame', 'social', 'new'],
  ['Lena', 'Roy', 'lena@alphaedge.com', 'AlphaEdge', 'linkedin', 'contacted'],
  ['Ishaan', 'Gupta', 'ishaan@brandloop.com', 'BrandLoop', 'event', 'pending'],
  ['Nora', 'Fernandes', 'nora@cloudharbor.io', 'CloudHarbor', 'website', 'qualified'],
  ['Tanya', 'Verma', 'tanya@pulseworks.co', 'PulseWorks', 'cold_email', 'lost'],
  ['Aditya', 'Menon', 'aditya@nextbeam.ai', 'NextBeam', 'referral', 'new'],
  ['Pooja', 'Iyer', 'pooja@stratuslab.com', 'StratusLab', 'linkedin', 'converted'],
  ['Rahul', 'Nair', 'rahul@orbitlane.com', 'OrbitLane', 'social', 'contacted'],
  ['Simran', 'Gill', 'simran@zenithhq.io', 'ZenithHQ', 'website', 'qualified'],
  ['Ritika', 'Saxena', 'ritika@craftbridge.com', 'CraftBridge', 'cold_call', 'new'],
  ['Dev', 'Arora', 'dev@motionstack.com', 'MotionStack', 'event', 'pending'],
  ['Kavya', 'Bose', 'kavya@lumaform.io', 'LumaForm', 'referral', 'converted'],
  ['Arjun', 'Kumar', 'arjun@leadflow.ai', 'Leadflow AI', 'website', 'qualified'],
];

const activityMessages = [
  'Created from inbound campaign.',
  'Follow-up scheduled for tomorrow.',
  'Proposal sent and awaiting feedback.',
  'Moved to the next stage after discovery call.',
];

const notes = [
  'Send pricing deck and timeline.',
  'Needs security review before next call.',
  'Book follow-up with decision maker.',
  'Waiting for budget approval.',
];

export const mockLeads: Lead[] = people.map(([firstName, lastName, email, company, source, status], index) => ({
  _id: `lead-${index + 1}`,
  firstName,
  lastName,
  email,
  company,
  source: source as Lead['source'],
  status: status as Lead['status'],
  phone: `+1 555 01${String(index + 10).padStart(2, '0')}`,
  notes: notes[index % notes.length],
  notesLog: [
    {
      _id: `note-${index + 1}-1`,
      text: notes[index % notes.length],
      createdAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
    },
  ],
  activities: [
    {
      type: 'created',
      message: activityMessages[index % activityMessages.length],
      createdAt: new Date(Date.now() - (index + 2) * 86400000).toISOString(),
    },
    {
      type: 'updated',
      message: `Updated with ${status} status and ${company} details.`,
      createdAt: new Date(Date.now() - (index + 1) * 43200000).toISOString(),
    },
  ],
}));
