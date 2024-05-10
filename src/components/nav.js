"use client"
import Link from "next/link"; // Corrected import statement
import { usePathname } from 'next/navigation';
import { FaChartSimple } from "react-icons/fa6";
import { RxAvatar } from "react-icons/rx";
import { BsTags } from "react-icons/bs";
import { LuMessagesSquare } from "react-icons/lu";
import { IoIosLogOut } from "react-icons/io";
import { useAuth } from "@/app/auth"; // Import useAuth hook from your authentication context file

export default function Nave() {
    const pathname = usePathname();
    const { logout } = useAuth(); // Accessing logout function from authentication context

    const handleLogout = () => {
        logout();
    };

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
                <div className={pathname === '/dashboard/tags' ? 'dash-link active' : 'dash-link'}>
                    <Link href={'/dashboard/tags'} ><BsTags className={pathname === '/dashboard/tags' ? 'icon act' : 'icon'} /> الكلمات الدليلية </Link>
                </div>
                <div className={pathname === '/dashboard/contact' ? 'dash-link active' : 'dash-link'}>
                    <Link href={'/dashboard/contact'} ><LuMessagesSquare className={pathname === '/dashboard/contact' ? 'icon act' : 'icon'} /> رسائل تواصل معنا  </Link>
                </div>
                <div className={'dash-link'} >
                    <IoIosLogOut className={'icon'} />
                    <a href="" onClick={handleLogout}>تسجيل خروج</a>
                </div>
            </div>
        </nav>
    );
}
