import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'MMA Garden Studio',description:'Garden services website and owner workspace',robots:{index:false,follow:false},icons:{icon:'/assets/mma/logo.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
