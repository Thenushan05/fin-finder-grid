/**
 * Named Sri Lankan fishing grounds — geographic reference data only.
 * All prediction/confidence/weather values come from the live backend via
 * predictFromPoint(). Nothing is hardcoded here.
 */

export interface RegularGround {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const mockRegularGrounds: RegularGround[] = [
  { id: "colombo-bank", name: "Colombo Bank", lat: 6.85, lng: 79.75 },
  {
    id: "trincomalee-grounds",
    name: "Trincomalee Grounds",
    lat: 8.65,
    lng: 81.6,
  },
  { id: "jaffna-bank", name: "Jaffna Bank", lat: 9.9, lng: 80.1 },
  { id: "negombo-bank", name: "Negombo Bank", lat: 7.35, lng: 79.75 },
  { id: "mannar-bank", name: "Mannar Bank", lat: 8.85, lng: 79.4 },
  {
    id: "galle-harbour-bank",
    name: "Galle Harbour Bank",
    lat: 6.02,
    lng: 80.25,
  },
  { id: "batticaloa-bank", name: "Batticaloa Bank", lat: 7.8, lng: 81.85 },
  { id: "mirissa-point", name: "Mirissa Point", lat: 5.92, lng: 80.62 },
  { id: "beruwala-grounds", name: "Beruwala Grounds", lat: 6.48, lng: 79.92 },
  {
    id: "mullaitivu-grounds",
    name: "Mullaitivu Grounds",
    lat: 9.28,
    lng: 80.82,
  },
];
