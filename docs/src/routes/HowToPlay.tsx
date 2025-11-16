const steps = [
  {
    title: 'Create a room',
    body: 'Head to the Keyroom, choose a question pack, and tap Start Game to generate a 6-digit code.'
  },
  {
    title: 'Share the code',
    body: 'Send the /code link or dictate the ##-##-## code to your friend so they can join as TWO.'
  },
  {
    title: 'Stack your questions',
    body: 'Drag the tiles to choose which question flies out next. The top card is what you will send.'
  },
  {
    title: 'Send and receive',
    body: 'Tap Send to launch a question. When a card arrives from your opponent, pick the correct answer before it flies away.'
  },
  {
    title: 'Scoring cadence',
    body: 'Rounds 1-4 are worth 1 point with 1 distractor, rounds 5-8 are 2 points with 2 distractors, rounds 9-12 are 3 points with 3 distractors.'
  },
  {
    title: 'Plane banner',
    body: 'Whenever someone answers, a banner streaks across the top to brag (or groan) about the result.'
  }
];

const HowToPlay = () => (
  <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-10">
    <h1 className="text-3xl font-bold">How to play Doze</h1>
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Step {index + 1}</p>
          <h2 className="text-xl font-semibold">{step.title}</h2>
          <p className="text-sm text-white/70">{step.body}</p>
        </li>
      ))}
    </ol>
  </div>
);

export default HowToPlay;
