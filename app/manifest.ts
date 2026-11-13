import type { MetadataRoute } from 'next';
export default function manifest():MetadataRoute.Manifest{return {name:'The Boundary',short_name:'Boundary',description:'Sport, beyond the score.',start_url:'/',display:'standalone',background_color:'#f7f7f4',theme_color:'#101e2d',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}]};}
