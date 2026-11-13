'use client';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="shell page"><h1>Something went wrong.</h1><p>Please try again.</p><button className="dark-button" onClick={reset}>TRY AGAIN</button></div>}
