"use client";

import React from 'react';
import {
  GOLD,
  MAROON,
  NAVY,
  CREAM,
  type BrochureData,
  type DayItinerary,
} from '@/lib/package-builder/brochure-defaults';

export const Logo = ({ size = 64, color = GOLD, showText = false }: { size?: number; color?: string; showText?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M8 78 L34 34 L50 60 L64 40 L92 78 Z" fill={color} />
      <path d="M50 22 L86 30 L58 40 L52 58 L46 40 L50 22 Z" fill={color} opacity="0.85" />
      <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="3" fill="none" opacity="0.5" />
    </svg>
    {showText && (
      <div style={{ lineHeight: 1.1 }}>
        <div className="brochure-serif" style={{ fontSize: 26, fontWeight: 800, color: MAROON }}>
          ADN ADVENTURES
        </div>
        <div style={{ fontSize: 12, letterSpacing: 3, color: GOLD, fontWeight: 600 }}>
          EXPLORE • DISCOVER • EXPERIENCE
        </div>
      </div>
    )}
  </div>
);

export const Watermark = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.08,
      pointerEvents: 'none',
    }}
  >
    <img src="/adn-logo.png" alt="watermark" style={{ width: 500, height: 340, objectFit: 'contain' }} />
  </div>
);

export const Footer = ({ showLabel = true }: { showLabel?: boolean }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 26,
      left: 60,
      right: 60,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 16,
      color: '#8a7a5a',
      borderTop: `1px solid ${GOLD}`,
      paddingTop: 12,
      fontFamily: 'Georgia, serif',
    }}
  >
    <span>{showLabel ? 'Package Details Template' : ''}</span>
    <span>www.adnadventures.com</span>
  </div>
);

export const GoldBar = ({ title }: { title: string }) => (
  <div
    style={{
      background: GOLD,
      borderRadius: 8,
      padding: '14px 30px',
      margin: '34px 60px 22px',
      boxShadow: '0 4px 14px rgba(212,169,74,0.35)',
    }}
  >
    <h2
      className="brochure-serif"
      style={{ fontSize: 34, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: 1 }}
    >
      {title}
    </h2>
  </div>
);

export const Img = ({ src, style }: { src: string | null | undefined; style?: React.CSSProperties }) =>
  src ? (
    <img
      src={src}
      alt=""
      crossOrigin="anonymous"
      style={{ objectFit: 'cover', display: 'block', ...style }}
    />
  ) : (
    <div
      style={{
        ...style,
        background: CREAM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b6a888',
        fontSize: 18,
        fontFamily: 'Georgia, serif',
      }}
    >
      Image
    </div>
  );

export const Bullet = ({
  children,
  color = GOLD,
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <li
    style={{
      display: 'flex',
      gap: 12,
      marginBottom: 14,
      alignItems: 'flex-start',
      fontFamily: 'Georgia, serif',
      fontSize: 22,
      lineHeight: 1.35,
    }}
  >
    <span style={{ color, fontWeight: 900, marginTop: 2 }}>●</span>
    <span>{children}</span>
  </li>
);

/* ---------------- PAGE COMPONENTS ---------------- */

export function CoverPage({ d }: { d: BrochureData }) {
  const c = d.cover;
  return (
    <div className="brochure-page">
      <div style={{ position: 'absolute', top: 26, left: 56 }}>
        <img
          src={c.logo ? c.logo : '/adn-logo.png'}
          alt="Logo"
          style={{ width: 230, height: 120, objectFit: 'contain' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <img
          src="/msme.jpg"
          alt="MSME registered"
          style={{ width: 110, height: 68, objectFit: 'contain' }}
        />
        <div style={{ fontSize: 11, color: '#4a4a4a', fontFamily: '"DM Sans", sans-serif' }}>
          UDYAM-PY-03-0062646
        </div>
      </div>
      <div style={{ textAlign: 'center', paddingTop: 110 }}>
        <div
          style={{
            letterSpacing: 8,
            fontSize: 20,
            color: MAROON,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Tour Package Details
        </div>
        <h1
          className="brochure-serif"
          style={{
            fontSize: 90,
            fontWeight: 900,
            color: GOLD,
            margin: '14px 0 4px',
            lineHeight: 1,
          }}
        >
          {c.destination || 'DESTINATION'}
        </h1>
        <div style={{ fontSize: 38, fontWeight: 800, color: NAVY, fontFamily: 'Georgia, serif' }}>
          {c.nights} Nights / {c.days} Days
        </div>
        <div
          className="brochure-body"
          style={{ fontStyle: 'italic', fontSize: 24, color: '#7d7d7d', marginTop: 10 }}
        >
          {c.tagline}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex' }}>
        <Img src={c.img1} style={{ width: '33.34%', height: 220 }} />
        <Img src={c.img2} style={{ width: '33.33%', height: 220 }} />
        <Img src={c.img3} style={{ width: '33.33%', height: 220 }} />
      </div>
    </div>
  );
}

export function WhyPage({ d }: { d: BrochureData }) {
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Why Travel With Us?" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '34px 60px',
          padding: '0 70px',
        }}
      >
        {d.why.map((item, i) => (
          <div
            key={item.id}
            style={{ display: 'flex', gap: 20, alignItems: 'baseline', justifyContent: 'flex-start' }}
          >
            <div
              style={{
                minWidth: 58,
                width: 68,
                height: 58,
                borderRadius: '50%',
                background: GOLD,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: 800,
                fontFamily: 'Georgia, serif',
              }}
            >
              {i + 1}
            </div>
            <div>
              <div className="brochure-serif" style={{ fontSize: 34, fontWeight: 800, color: MAROON }}>
                {item.title}
              </div>
              <div
                className="brochure-body"
                style={{ fontSize: 24, color: '#4a4a4a', lineHeight: 1.35 }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export function DayPage({ day, title = 'Day-wise Itinerary' }: { day: DayItinerary; title?: string }) {
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title={title || 'Day-wise Itinerary'} />
      <div style={{ display: 'flex', gap: 50, padding: '0 70px' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'inline-block',
              background: GOLD,
              color: '#fff',
              padding: '8px 24px',
              borderRadius: 6,
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'Georgia, serif',
              marginBottom: 26,
            }}
          >
            {day.title || `DAY ${day.dayNumber}`}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {day.activities.map((a) => (
              <Bullet key={a.id}>
                <span style={{ fontWeight: 700, fontSize: 24, color: '#222' }}>{a.text}</span>
              </Bullet>
            ))}
          </ul>
        </div>
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Img src={day.imgTop} style={{ width: '100%', height: 215, borderRadius: 12 }} />
          <Img src={day.imgBottom} style={{ width: '100%', height: 215, borderRadius: 12 }} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function InclPage({ d }: { d: BrochureData }) {
  const box = (title: string, items: { id: string; text: string }[], color: string) => (
    <div style={{ flex: 1, background: CREAM, borderRadius: 16, padding: '30px 36px' }}>
      <div
        className="brochure-serif"
        style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 20, letterSpacing: 1 }}
      >
        {title}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((it) => (
          <Bullet key={it.id} color={color}>
            {it.text}
          </Bullet>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Inclusions & Exclusions" />
      <div style={{ display: 'flex', gap: 40, padding: '0 70px', alignItems: 'flex-start' }}>
        {box('INCLUSIONS', d.inclusions, '#2e7d32')}
        {box('EXCLUSIONS', d.exclusions, '#c62828')}
      </div>
      <Footer />
    </div>
  );
}

export function PricePage({ d }: { d: BrochureData }) {
  const rowCount = d.priceRows.length;
  const rowFontSize = Math.max(14, 24 - Math.max(0, rowCount - 6));
  const rowPadding = Math.max(4, 13 - Math.max(0, rowCount - 6));
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Price Chart" />
      <div style={{ padding: '0 70px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Georgia, serif',
            fontSize: rowFontSize,
          }}
        >
          <thead>
            <tr style={{ background: GOLD, color: '#fff' }}>
              {['No. of Persons', 'Rate Per Head', 'Rooms Count', 'Vehicle'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: `${rowPadding}px 20px`,
                    textAlign: 'left',
                    fontWeight: 800,
                    fontSize: rowFontSize + 2,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.priceRows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? '#fff' : CREAM }}>
                <td style={{ padding: `${rowPadding}px 20px`, fontSize: rowFontSize }}>{r.persons}</td>
                <td style={{ padding: `${rowPadding}px 20px`, fontSize: rowFontSize }}>
                  ₹ {Number(r.rate || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: `${rowPadding}px 20px`, fontSize: rowFontSize }}>{r.rooms}</td>
                <td style={{ padding: `${rowPadding}px 20px`, fontSize: rowFontSize }}>{r.vehicle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
}

export function GalleryPage({ d }: { d: BrochureData }) {
  const imgs = d.gallery.filter((g) => g.img);
  const cols = Math.min(5, Math.max(1, Math.ceil(imgs.length / 2))) || 5;
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Our Customers Gallery" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${imgs.length ? cols : 5}, 1fr)`,
          gap: 16,
          padding: '0 70px',
        }}
      >
        {(imgs.length ? imgs : d.gallery).map((g) => (
          <Img key={g.id} src={g.img} style={{ width: '100%', height: 205, borderRadius: 10 }} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

export function TermsPage({ d }: { d: BrochureData }) {
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Terms & Policies" />
      <div style={{ display: 'flex', gap: 50, padding: '0 70px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1.3 }}>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 20, margin: 0 }}>
            {d.terms.map((t) => (
              <Bullet key={t.id}>{t.text}</Bullet>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div
            className="brochure-serif"
            style={{ fontSize: 30, fontWeight: 800, color: MAROON, marginBottom: 18 }}
          >
            Payment Charges
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Georgia, serif',
              fontSize: 21,
            }}
          >
            <thead>
              <tr style={{ background: GOLD, color: '#fff' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Payment Window</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Charge</th>
              </tr>
            </thead>
            <tbody>
              {d.paymentCharges.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? '#fff' : CREAM }}>
                  <td style={{ padding: '12px 18px' }}>{r.window}</td>
                  <td style={{ padding: '12px 18px' }}>{r.charge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer showLabel={false} />
    </div>
  );
}

export function CancelPage({ d }: { d: BrochureData }) {
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Cancellation Policy" />
      <div style={{ padding: '0 70px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {d.cancellation.map((t) => (
            <Bullet key={t.id}>{t.text}</Bullet>
          ))}
        </ul>
      </div>
      <div
        style={{
          background: NAVY,
          borderRadius: 12,
          padding: '18px 30px',
          margin: '20px 70px 0',
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {d.priceNotes.map((n) => (
            <li
              key={n.id}
              style={{
                color: '#fff',
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                marginBottom: 10,
                display: 'flex',
                gap: 12,
              }}
            >
              <span style={{ color: GOLD }}>●</span>
              {n.text}
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
}

export function PaymentPage({ d }: { d: BrochureData }) {
  const p = d.payment;
  const rows: [string, string][] = [
    ['Bank Name', p.bankName],
    ['Account Name', p.accountName],
    ['A/C No.', p.accountNo],
    ['IFSC Code', p.ifsc],
    ['Branch', p.branch],
    ['Phone No.', p.phone],
    ['UPI / GPay', p.upi],
  ];
  const rating = Math.max(0, Math.min(5, Number(p.rating) || 0));
  return (
    <div className="brochure-page">
      <Watermark />
      <GoldBar title="Payment Details" />
      <div style={{ display: 'flex', gap: 50, padding: '0 70px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {rows.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                marginBottom: 16,
                fontFamily: 'Georgia, serif',
                fontSize: 24,
              }}
            >
              <span style={{ width: 180, fontWeight: 800, color: MAROON }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            width: 360,
            background: CREAM,
            borderRadius: 16,
            padding: 26,
            textAlign: 'center',
          }}
        >
          <Img
            src={p.qr ? p.qr : '/adn-qr.jpeg'}
            style={{ width: 240, height: 220, margin: '0 auto', borderRadius: 8, background: '#fff' }}
          />
          <div
            style={{
              fontSize: 18,
              color: '#555',
              margin: '12px 0',
              fontFamily: 'Georgia, serif',
            }}
          >
            Scan to pay with any UPI app
          </div>
          <div
            style={{
              fontWeight: 800,
              color: MAROON,
              fontFamily: 'Georgia, serif',
              fontSize: 20,
            }}
          >
            {p.bankName} ••{String(p.accountNo).slice(-4)}
          </div>
          <div style={{ fontSize: 18, color: '#333', fontFamily: 'Georgia, serif' }}>{p.upi}</div>
        </div>
      </div>
      <div
        style={{
          margin: '30px 70px 0',
          background: CREAM,
          borderRadius: 14,
          padding: '20px 30px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              fontWeight: 800,
              color: MAROON,
              fontFamily: 'Georgia, serif',
              fontSize: 22,
            }}
          >
            Google Reviews
          </span>
          <span style={{ color: GOLD, fontSize: 26, letterSpacing: 2 }}>
            {'★'.repeat(Math.round(rating))}
            {'☆'.repeat(5 - Math.round(rating))}
          </span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20 }}>
            {rating.toFixed(1)} / 5
          </span>
        </div>
        <div
          style={{
            fontStyle: 'italic',
            color: '#444',
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            marginTop: 8,
          }}
        >
          “{p.testimonial}”
        </div>
      </div>
      <Footer />
    </div>
  );
}

export type PageSpec = {
  page: string;
  dayIndex?: number;
};

export function BrochurePage({
  page,
  data,
  dayIndex = 0,
}: {
  page: string;
  data: BrochureData;
  dayIndex?: number;
}) {
  switch (page) {
    case 'cover':
      return <CoverPage d={data} />;
    case 'why':
      return <WhyPage d={data} />;
    case 'day':
      return (
        <DayPage
          day={data.days[dayIndex] || data.days[0]}
          title={data.itineraryHeading || 'Day-wise Itinerary'}
        />
      );
    case 'incl':
      return <InclPage d={data} />;
    case 'price':
      return <PricePage d={data} />;
    case 'gallery':
      return <GalleryPage d={data} />;
    case 'terms':
      return <TermsPage d={data} />;
    case 'cancel':
      return <CancelPage d={data} />;
    case 'payment':
      return <PaymentPage d={data} />;
    default:
      return null;
  }
}

/* Flattened ordered list of pages for export */
export function buildPageList(data: BrochureData): PageSpec[] {
  const list: PageSpec[] = [{ page: 'cover' }, { page: 'why' }];
  data.days.forEach((_, i) => list.push({ page: 'day', dayIndex: i }));
  list.push(
    { page: 'incl' },
    { page: 'price' },
    { page: 'gallery' },
    { page: 'terms' },
    { page: 'cancel' },
    { page: 'payment' },
  );
  return list;
}
