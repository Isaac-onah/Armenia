import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { HostConsole } from './host/host-console';
import { MapBoard } from './map/map-board';
import { Projector } from './map/projector';
import { MediaHouse } from './places/media-house/media-house';
import { TvPlace } from './places/media-house/tv-place';
import { CivicHouse } from './places/civic-house/civic-house';
import { PartyHq } from './places/party-hq/party-hq';
import { Square } from './places/square/square';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'host', component: HostConsole },
  {
    path: 'map/:code',
    component: MapBoard,
    children: [
      { path: 'media', component: MediaHouse },
      { path: 'civic', component: CivicHouse },
      { path: 'peoples', component: PartyHq, data: { slug: 'peoples' } },
      { path: 'democrats', component: PartyHq, data: { slug: 'democrats' } },
      { path: 'square', component: Square },
      { path: 'tv', component: TvPlace },
      { path: 'screen', component: Projector },
    ],
  },
  { path: '**', redirectTo: '' },
];
