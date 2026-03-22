const phases = [
  {
    id: 'phase-1',
    title: 'Phase 1: Compliance Concerns',
    range: '18 Aug — 31 Oct 2025',
    colour: 'var(--phase-1)',
    summary:
      'Operational cases showing recurring complaint-handling, consent, vulnerability, and escalation concerns while guidance was being sought through chats and supervisors.'
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Grievance and Interim Arrangements',
    range: '1 Nov — 19 Dec 2025',
    colour: 'var(--phase-2)',
    summary:
      'Formal grievance handling, response gaps, interim-manager arrangements, working-practice ambiguity, and pay-related pressure.'
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Operational Silence',
    range: '20 Dec 2025 — 19 Mar 2026',
    colour: 'var(--phase-3)',
    summary:
      'Escalation into prolonged silence, blocked reporting structure, financial detriment, and statutory delay markers.'
  }
];

const timelineEntries = [
  {
    id: 't-01',
    label: '22 Aug · T-01',
    title: 'Silence Treated as Consent to Contract',
    body: 'Instruction that consent could be inferred from a contract email having been sent, despite disputed agreement.',
    kind: 'operational',
    date: '2025-08-22',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 't-06',
    label: '25 Sept · T-06',
    title: 'Complaint closed despite customer instruction',
    body: 'Customer said complaint should remain open until resolved; closure pressure and metric-driven handling are central to this case.',
    kind: 'operational',
    date: '2025-09-25',
    side: 'bottom',
    evidenceUrl: '#evidence'
  },
  {
    id: 't-09',
    label: '6 Sept · T-09',
    title: 'Early workload distress warning',
    body: 'Message to operations management that only vague guidance had been received, putting the agent in a difficult position with customers.',
    kind: 'operational',
    date: '2025-09-06',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'gh-01',
    label: '30 Oct · GH-01',
    title: 'Initial email to HR',
    body: 'Initial contact outlining difficulties and requesting change of team or department.',
    kind: 'grievance',
    date: '2025-10-30',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 't-22',
    label: '6 Oct / 20 Oct · T-22',
    title: 'Translator refused and ADR blocked',
    body: 'A vulnerable customer with limited English was told the debt stood and the complaint should be closed without ADR being mentioned.',
    kind: 'operational',
    date: '2025-10-20',
    side: 'bottom',
    evidenceUrl: '#evidence'
  },
  {
    id: 'sec-3',
    label: '20 Oct · Section 3',
    title: 'Complaints Training “Back to Basics”',
    body: 'Training promoted rapid complaint closure and adviser-led resolution, later analysed against Ofcom complaint-handling obligations.',
    kind: 'operational',
    date: '2025-10-20',
    side: 'top',
    evidenceUrl: '#report'
  },
  {
    id: 'gh-04',
    label: '11 Nov · GH-04',
    title: 'ER acknowledges receipt',
    body: 'Policy and dignity assurances given after the initial HR contact.',
    kind: 'grievance',
    date: '2025-11-11',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'gh-20-3',
    label: '29 Nov · GH-20.3',
    title: 'Manager warns pay may be withheld',
    body: 'Working in meeting status while awaiting a safe reporting line was stated to be “not a valid reason” for payment.',
    kind: 'grievance',
    date: '2025-11-29',
    side: 'bottom',
    evidenceUrl: '#evidence'
  },
  {
    id: 'gh-29',
    label: '19 Dec · GH-29',
    title: 'Expanded dossier submitted',
    body: 'Expanded dossier submitted with requests for acknowledgement, owner, and neutral Team Leader.',
    kind: 'grievance',
    date: '2025-12-19',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'gh-32',
    label: '5 Jan · GH-32',
    title: 'Reporting conflict flagged',
    body: 'New Team Leader and trainer were both named in the expanded dossier, creating reporting conflict concerns.',
    kind: 'grievance',
    date: '2026-01-05',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'jan-webex',
    label: '9 Jan',
    title: 'WebEx meeting with TL and trainer',
    body: 'Grievance disclosed; safe-work concern explained; both indicated they would seek clarification from ER.',
    kind: 'operational',
    date: '2026-01-09',
    side: 'bottom',
    evidenceUrl: '#timeline'
  },
  {
    id: 'hear',
    label: '9–13 Jan',
    title: 'Escalated to HEAR (Resolution Hub)',
    body: 'Internal escalation process for stalled HR/ER matters stated a 24-hour response, but no response was received.',
    kind: 'grievance',
    date: '2026-01-13',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'gh-36',
    label: '26 Jan · GH-36',
    title: 'Authorised TL to liaise with ER',
    body: 'TL told ER would not engage with her regarding the grievance; procedural liaison only.',
    kind: 'grievance',
    date: '2026-01-26',
    side: 'top',
    evidenceUrl: '#evidence'
  },
  {
    id: 'financial',
    label: '24 Nov – 11 Jan',
    title: 'Financial detriment crystallised',
    body: 'Estimated €1,800 gross pay shortfall identified in phase 3 visual summary.',
    kind: 'impact',
    date: '2026-02-11',
    side: 'top',
    evidenceUrl: '#timeline'
  },
  {
    id: 'statutory',
    label: '19 Mar',
    title: 'Silence exceeding statutory 3-month period',
    body: 'No investigator appointed, no interim safeguards confirmed, and no reporting structure established.',
    kind: 'impact',
    date: '2026-03-19',
    side: 'bottom',
    evidenceUrl: '#timeline'
  },
  {
    id: 'gh-37',
    label: '18 Mar · GH-37',
    title: 'Primary grievance subject reassigned TL',
    body: 'Explicit breach of ER’s prior written safety direction regarding no direct contact.',
    kind: 'impact',
    date: '2026-03-18',
    side: 'top',
    evidenceUrl: '#evidence'
  }
];

const phaseCards = document.getElementById('phaseCards');
const timelineTrack = document.getElementById('timelineTrack');
const filterButtons = document.querySelectorAll('[data-filter]');

function renderPhaseCards() {
  phaseCards.innerHTML = phases
    .map(
      (phase) => `
        <article class="phase-card" style="--accent:${phase.colour}">
          <p class="eyebrow">${phase.id.replace('-', ' ')}</p>
          <h3>${phase.title}</h3>
          <span class="date-range">${phase.range}</span>
          <p>${phase.summary}</p>
        </article>
      `
    )
    .join('');
}

function dateToPercent(dateString) {
  const min = new Date('2025-08-18').getTime();
  const max = new Date('2026-03-19').getTime();
  const value = new Date(dateString).getTime();
  return ((value - min) / (max - min)) * 100;
}

function renderTimeline(filter = 'all') {
  const visibleEntries = timelineEntries.filter((entry) => filter === 'all' || entry.kind === filter);

  timelineTrack.innerHTML = visibleEntries
    .map((entry) => {
      const left = Math.min(Math.max(dateToPercent(entry.date), 1), 94);
      const top = entry.side === 'top' ? 0 : 340;
      return `
        <article
          class="timeline-entry"
          data-kind="${entry.kind}"
          data-side="${entry.side}"
          style="left: calc(${left}% - 110px); top: ${top}px;"
        >
          <span class="entry-date">${entry.label}</span>
          <h3>${entry.title}</h3>
          <p>${entry.body}</p>
          <a href="${entry.evidenceUrl}">Open reference scaffold</a>
        </article>
      `;
    })
    .join('');

  timelineTrack.style.height = '620px';
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    renderTimeline(button.dataset.filter);
  });
});

renderPhaseCards();
renderTimeline();