import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { site } from '@/config/site';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:'The Boundary | Sport, beyond the score',template:'%s | The Boundary'},description:site.description,alternates:{canonical:'/'},openGraph:{type:'website',siteName:site.name,title:'The Boundary',description:site.description},twitter:{card:'summary_large_image'},manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}){const schema={'@context':'https://schema.org','@graph':[{'@type':'Organization',name:site.name,url:site.url},{'@type':'WebSite',name:site.name,url:site.url,potentialAction:{'@type':'SearchAction',target:`${site.url}/search?q={search_term_string}`,'query-input':'required name=search_term_string'}}]};return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></body></html>}
