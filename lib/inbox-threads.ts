export type InboxThreadPreview = {
  peer: string;
  preview: string;
  time: string;
};

/** Prototype previews — not persisted */
export const inboxThreadPreviews: InboxThreadPreview[] = [
  { peer: 'jarrodwatts', preview: "If you're ever open to a quick chat about…", time: 'Tue' },
  { peer: 'mitchellh', preview: 'Thanks for the pointer on the module split.', time: 'Mon' },
  { peer: 'niels9001', preview: 'Prototype thread — not real.', time: 'Sun' },
];
