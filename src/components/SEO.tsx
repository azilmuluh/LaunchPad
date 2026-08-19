import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  noindex?: boolean;
}

export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = 'https://launchpadcm.netlify.app/LaunchPad.svg',
  noindex = false
}: SEOProps) {
  const siteName = 'LaunchPad Community';
  const fullTitle = title || `${siteName} | Scholarships, Internships & Jobs for African Youth`;
  const defaultDesc = 'LaunchPad connects African youth to scholarships, internships, competitions, and jobs. Built for Cameroonian students by LaunchPad Community.';
  const defaultKeywords = 'scholarships, internships, competitions, jobs, african youth, cameroon, career opportunities, launchpad, launchpadcm, launchpadcm.netlify.app, LaunchPad, LaunchPad Community, guide for african youth, guide for cameroonian youth, how to get scholarships in cameroon, IYMC, ICSC, Launchpad, opportunity, technology, health, opportunities in Africa, Cameroon Opportunities, discovery platform, opportunity discovery platform, DAAD scholarship Cameroon, fully funded scholarships for Cameroonians, Mastercard Foundation scholarship 2026, Tony Elumelu Fellowship Cameroon, scholarships for Cameroonian students 2026, internships for African youth, Chevening scholarship Africa, Commonwealth scholarship Cameroon, Fulbright scholarship Cameroon 2026, Rhodes scholarship West Africa, Google career certificate scholarship Africa, Erasmus Mundus scholarship Africa, study abroad scholarships Cameroon, youth opportunities Cameroon 2026, African youth fellowship programs, leadership programs for Cameroonian youth, free opportunities for young Africans, scholarships open to Cameroon 2026';
  const url = 'https://launchpadcm.netlify.app';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDesc} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      {canonical && !noindex && <link rel="canonical" href={`${url}${canonical}`} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical ? `${url}${canonical}` : url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical ? `${url}${canonical}` : url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
