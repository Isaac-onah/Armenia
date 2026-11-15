import type { PartySlug } from '../../core/models';

export interface PartyOffice {
  slug: PartySlug;
  pin: string;
  title: string;
  building: string;
  portrait: string;
  hail: string;
  contender: string;
  pitch: string;
  manifesto: string;
  pledges: string[];
  seats: number;
  percent: number;
  posts: string[];
  history: string;
}

export const HOUSE_SEATS = 65;

export const PARTY_OFFICES: Record<PartySlug, PartyOffice> = {
  peoples: {
    slug: 'peoples',
    pin: 'Pin 3',
    title: "People's Party HQ",
    building: 'assets/places/peoples.png',
    portrait: 'assets/people/peoples-candidate.png',
    hail: 'assets/people/peoples-hail.png',
    contender: 'Luca Vella',
    pitch: 'The harbour already knows this voice.',
    manifesto:
      'Open the youth centre on the square, with a hall the ferry towns can use after school and a yard that stays lit in the evening. Keep the harbour lights on for the night market, and keep the ferry running on the hour so the outer towns are not cut off. Speak for the towns that already know us, and put the youth-centre promise back on paper before this House rises.',
    pledges: [
      'Open the youth centre on the square, with a hall the ferry towns can use after school and a yard that stays lit in the evening.',
      'Keep the harbour lights on for the night market, and keep the ferry running on the hour so the outer towns are not cut off.',
      'Speak for the towns that already know us, and put the youth-centre promise back on paper before this House rises.',
    ],
    seats: 29,
    percent: 45,
    posts: [
      'Leader of the House',
      'Minister for the Harbours',
      'Six local councils on the ferry side',
    ],
    history:
      'The People\'s Party grew out of the harbour committees. It held the House through the ferry years, and it is still the largest group there. It lost ground when the youth centre promise slipped. This election is its chance to put that promise back on paper.',
  },
  democrats: {
    slug: 'democrats',
    pin: 'Pin 4',
    title: 'Democratic Party HQ',
    building: 'assets/places/democrats.png',
    portrait: 'assets/people/democrat.png',
    hail: 'assets/people/democrat-hail.png',
    contender: 'Andre Galea',
    pitch: 'A steadier hand for the quiet towns.',
    manifesto:
      'Keep a steadier hand than the last term, and finish a promise before a new one is shouted from the square. Put the boats and the quiet towns first, with a yard for the fishing harbours and a say for the villages off the main road. Earn trust before the next headline, and let the House see the bill before the media house reads it aloud.',
    pledges: [
      'Keep a steadier hand than the last term, and finish a promise before a new one is shouted from the square.',
      'Put the boats and the quiet towns first, with a yard for the fishing harbours and a say for the villages off the main road.',
      'Earn trust before the next headline, and let the House see the bill before the media house reads it aloud.',
    ],
    seats: 27,
    percent: 42,
    posts: [
      'Leader of the Opposition',
      'Chair of the civic committee',
      'Four local councils in the quiet towns',
    ],
    history:
      'The Democratic Party grew out of the village councils. It gained seats by talking about the boats and the quieter towns, and it is the second group in the House. It has not held the majority. Galea is standing so the island has a choice beside the harbour party.',
  },
};

export function partyOffice(slug: PartySlug): PartyOffice {
  return PARTY_OFFICES[slug];
}
