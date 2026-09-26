import { site } from '../data/site';

type PromoteKey = keyof typeof site.partner.promote;

/** Is this partner placement switched on? (site.ts → partner.promote) */
export const promote = (key: PromoteKey): boolean => site.partner.enabled && Boolean(site.partner.promote[key]);

/** mailto: link with subject + a short pre-filled message. '' when there is no email. */
export const partnerMailto = (): string =>
  site.email
    ? `mailto:${site.email}?subject=${encodeURIComponent(site.partner.emailSubject)}&body=${encodeURIComponent(site.partner.emailBody)}`
    : '';

/** Link to the partner section — works from any page (same-page jump on home). */
export const partnerHref = '/#partner';
