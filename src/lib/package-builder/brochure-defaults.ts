export const GOLD = '#D4A94A';
export const MAROON = '#7A2E3A';
export const NAVY = '#2C3E50';
export const CREAM = '#F3EDE3';
export const PAGE_WIDTH = 1122.52;
export const PAGE_HEIGHT = 793.7;

let idc = 0;
export const uid = (): string => `id_${Date.now()}_${idc++}`;

export const withIds = <T extends Record<string, unknown>>(arr: T[]): (T & { id: string })[] =>
  arr.map((v) => ({ id: uid(), ...v }));

export type CoverData = {
  logo: string | null;
  destination: string;
  nights: number | string;
  days: number | string;
  tagline: string;
  img1: string | null;
  img2: string | null;
  img3: string | null;
};

export type WhyItem = {
  id: string;
  title: string;
  desc: string;
};

export type ActivityItem = {
  id: string;
  text: string;
};

export type DayItinerary = {
  id: string;
  dayNumber: number;
  title: string;
  activities: ActivityItem[];
  imgTop: string | null;
  imgBottom: string | null;
};

export type TextItem = {
  id: string;
  text: string;
};

export type PriceRow = {
  id: string;
  persons: string;
  rate: string;
  rooms: string;
  vehicle: string;
};

export type GalleryItem = {
  id: string;
  img: string | null;
  name?: string;
};

export type PaymentCharge = {
  id: string;
  window: string;
  charge: string;
};

export type PaymentDetails = {
  bankName: string;
  accountName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  phone: string;
  upi: string;
  qr: string | null;
  rating: number | string;
  testimonial: string;
};

export type BrochureData = {
  cover: CoverData;
  why: WhyItem[];
  itineraryHeading?: string;
  days: DayItinerary[];
  inclusions: TextItem[];
  exclusions: TextItem[];
  priceRows: PriceRow[];
  priceNotes: TextItem[];
  gallery: GalleryItem[];
  advancePct: number | string;
  terms: TextItem[];
  paymentCharges: PaymentCharge[];
  cancellation: TextItem[];
  payment: PaymentDetails;
};

export type PageKey =
  | 'cover'
  | 'why'
  | 'days'
  | 'incl'
  | 'price'
  | 'gallery'
  | 'terms'
  | 'cancel'
  | 'payment';

export const DEFAULT_GALLERY_IMAGES = [
  { name: 'c1.jpeg', url: '/package-builder/gallery/c1.jpeg' },
  { name: 'c2.jpeg', url: '/package-builder/gallery/c2.jpeg' },
  { name: 'c3.jpeg', url: '/package-builder/gallery/c3.jpeg' },
  { name: 'c4.jpeg', url: '/package-builder/gallery/c4.jpeg' },
  { name: 'c5.jpeg', url: '/package-builder/gallery/c5.jpeg' },
  { name: 'c6.jpeg', url: '/package-builder/gallery/c6.jpeg' },
  { name: 'c7.jpeg', url: '/package-builder/gallery/c7.jpeg' },
  { name: 'c8.jpeg', url: '/package-builder/gallery/c8.jpeg' },
];

export const buildDefaultGallery = (): GalleryItem[] =>
  DEFAULT_GALLERY_IMAGES.map((item) => ({
    id: uid(),
    img: item.url,
    name: item.name,
  }));

export const defaultData = (): BrochureData => ({
  cover: {
    logo: null,
    destination: 'VAGAMON',
    nights: 2,
    days: 3,
    tagline: 'Your Journey Our Responsibilities…',
    img1: null,
    img2: null,
    img3: null,
  },
  why: withIds([
    { title: '2+ Years Experience', desc: 'Trusted operational team that plans and executes trips end-to-end.' },
    { title: 'We Listen First', desc: 'Custom itineraries built around what you want — not a fixed package.' },
    { title: 'Local Expert Guides', desc: 'Trained tour guides with deep, on-ground destination knowledge.' },
    { title: '24/7 Support', desc: 'Round-the-clock assistance before, during, and after your trip.' },
    { title: 'Safe & Worry-Free', desc: 'Every detail managed so you can relax and enjoy the journey.' },
    { title: 'Trusted by Hundreds', desc: 'Repeat customers and referrals are the backbone of our business.' },
  ]),
  itineraryHeading: 'Day-wise Itinerary',
  days: [
    {
      id: uid(),
      dayNumber: 1,
      title: 'Day 1 - Arrival & Sightseeing',
      activities: withIds([
        { text: 'Arrival & Check-in' },
        { text: 'Uluppuni Tunnel' },
        { text: 'Suicide Point' },
        { text: 'Pine Forest Walk' },
      ]),
      imgTop: null,
      imgBottom: null,
    },
    {
      id: uid(),
      dayNumber: 2,
      title: 'Day 2 - Sightseeing',
      activities: withIds([
        { text: 'Sunrise Viewpoint' },
        { text: 'Kurisumala Trek' },
        { text: 'Meadows & Tea Gardens' },
        { text: 'Bonfire Evening' },
      ]),
      imgTop: null,
      imgBottom: null,
    },
  ],
  inclusions: withIds([
    { text: 'Deluxe Room Accommodation' },
    { text: 'Pick-up & Drop location' },
    { text: 'Private Cab for Entire Trip' },
    { text: 'Sightseeing as per Itinerary' },
    { text: 'Breakfast & Dinner' },
    { text: 'Driver Allowance' },
    { text: 'Fuel Charges' },
    { text: 'Toll & Parking Charges' },
    { text: 'Jeep Safari' },
    { text: 'All Applicable Taxes' },
  ]),
  exclusions: withIds([
    { text: 'Entry Tickets to Tourist Attractions' },
    { text: 'Adventure Activity Charges' },
    { text: 'Personal Expenses' },
    { text: 'Any Services Not Mentioned in Inclusions' },
  ]),
  priceRows: withIds([
    { persons: '2', rate: '8500', rooms: '1', vehicle: 'Sedan' },
    { persons: '4', rate: '7000', rooms: '2', vehicle: 'Innova' },
    { persons: '6', rate: '6000', rooms: '3', vehicle: '12 seater' },
    { persons: '10', rate: '5200', rooms: '5', vehicle: '21 seater' },
  ]),
  priceNotes: withIds([
    { text: 'Price may vary depending on group size and travel season.' },
    { text: 'Package can be customized to fit your needs.' },
    { text: "Everything under 'Inclusions' is provided; items under 'Exclusions' are payable separately." },
    { text: 'Price may vary depending on your location.' },
  ]),
  gallery: buildDefaultGallery(),
  advancePct: 40,
  terms: withIds([
    { text: 'Itinerary is subject to change due to weather conditions or unforeseen delays.' },
    { text: 'An advance payment of 40% is required to confirm the booking.' },
    { text: 'Full payment must be completed before the departure date.' },
    { text: 'Any damage caused to property or vehicle will be the liability of the guest.' },
    { text: 'ADN Adventures is not responsible for loss of personal belongings.' },
    { text: 'Valid ID documents must be submitted at the time of booking.' },
  ]),
  paymentCharges: withIds([
    { window: '15+ days before departure', charge: '40%' },
    { window: 'Before 24 hours', charge: '60%' },
  ]),
  cancellation: withIds([
    { text: '75% deduction for cancellations made before 7 days of departure.' },
    { text: '100% deduction for cancellations made before 3 days of departure.' },
    { text: 'No refund will be provided for no-shows.' },
    { text: 'Refund processing takes 7-10 working days.' },
  ]),
  payment: {
    bankName: 'State Bank of India (SBI)',
    accountName: 'V. Adhithyan',
    accountNo: '42839524598',
    ifsc: 'SBIN0011733',
    branch: 'Velachery',
    phone: '+91 80985 94364',
    upi: 'adnadventures@upi',
    qr: null,
    rating: 4.9,
    testimonial: 'Best trip we ever had! Everything was perfectly organized and the guides were amazing.',
  },
});

export const PAGES: { key: PageKey; label: string }[] = [
  { key: 'cover', label: 'Cover' },
  { key: 'why', label: 'Why Travel With Us' },
  { key: 'days', label: 'Itinerary' },
  { key: 'incl', label: 'Inclusions & Exclusions' },
  { key: 'price', label: 'Price Chart' },
  { key: 'gallery', label: 'Customer Gallery' },
  { key: 'terms', label: 'Terms & Policies' },
  { key: 'cancel', label: 'Cancellation Policy' },
  { key: 'payment', label: 'Payment Details' },
];
