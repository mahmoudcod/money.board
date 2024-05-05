"use client"
import Link from "next/link"; // Corrected import statement
import { usePathname } from 'next/navigation'
import { FaChartSimple } from "react-icons/fa6";
import { RxAvatar } from "react-icons/rx";




export default function Nave() {
    const pathname = usePathname()
    return (
        <nav className="dashboard-nav">
            <div className="dash-logo">
                <img src="/image.png" />
            </div>

            <div className="dash-links">

                <div className={pathname === '/dashboard/posts' ? 'dash-link active' : 'dash-link'}>
                    <Link href={'/dashboard/posts'} ><FaChartSimple className={pathname === '/dashboard/posts' ? 'icon act' : 'icon'} />مقالات </Link>
                </div>
                <div className={pathname === '/dashboard/figure' ? 'dash-link active' : 'dash-link'}>
                    <Link href={'/dashboard/figure'} ><RxAvatar className={pathname === '/dashboard/figure' ? 'icon act' : 'icon'} /> شخصيات </Link>
                </div>
            </div>
        </nav>
    );
}
