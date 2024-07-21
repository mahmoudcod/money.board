'use client'
import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FaChartSimple } from "react-icons/fa6";
import { BiCategory } from "react-icons/bi";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import { MdOutlinePolicy } from "react-icons/md";
import { BsTags } from "react-icons/bs";
import { RiFolderImageLine } from "react-icons/ri";
import { LuMessagesSquare } from "react-icons/lu";
import { IoIosLogOut, IoIosMenu } from "react-icons/io";
import { useAuth } from "@/app/auth";
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';

const GET_LOGO = gql`
  query getLogo {
    logo {
      data {
        id
        attributes {
          appName
        }
      }
    }
  }
`;

export default function Nave() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const { data, loading, error } = useQuery(GET_LOGO);
    const appName = data?.logo?.data?.attributes?.appName || 'صناع المال';

    const handleSidebarToggle = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) return null
    if (error) return null;

    return (
        <div className="dashboard">
            <button className="sidebar-toggle" onClick={handleSidebarToggle}>
                <IoIosMenu />
            </button>

            <nav className={`dashboard-nav ${isSidebarOpen ? 'open' : ''}`}>
                <div className="dash-logo">
                    {/* <img src="/image.png" /> */}
                    <h1>{appName}</h1>
                </div>

                <div className="dash-links">
                    <div className={pathname === '/dashboard/posts' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/posts'} ><FaChartSimple className={pathname === '/dashboard/posts' ? 'icon act' : 'icon'} />مقالات </Link>
                    </div>
                    <div className={pathname === '/dashboard/category' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/category'} ><BiCategory className={pathname === '/dashboard/category' ? 'icon act' : 'icon'} />التصنيفات </Link>
                    </div>
                    <div className={pathname === '/dashboard/subCat' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/subCat'} ><BiCategory className={pathname === '/dashboard/subCat' ? 'icon act' : 'icon'} />التصنيفات الفرعية </Link>
                    </div>
                    <div className={pathname === '/dashboard/tags' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/tags'} ><BsTags className={pathname === '/dashboard/tags' ? 'icon act' : 'icon'} /> الكلمات الدليلية </Link>
                    </div>
                    <div className={pathname === '/dashboard/users' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/users'} ><FaUsers className={pathname === '/dashboard/users' ? 'icon act' : 'icon'} />   المستخدمين  </Link>
                    </div>
                    <div className={pathname === '/dashboard/contact' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/contact'} ><LuMessagesSquare className={pathname === '/dashboard/contact' ? 'icon act' : 'icon'} /> رسائل تواصل معنا  </Link>
                    </div>
                    <div className={pathname === '/dashboard/commint' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/commint'} ><LuMessagesSquare className={pathname === '/dashboard/commint' ? 'icon act' : 'icon'} /> التعليقات </Link>
                    </div>
                    <div className={pathname === '/dashboard/images' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/images'} ><RiFolderImageLine className={pathname === '/dashboard/images' ? 'icon act' : 'icon'} />   مكتبة الصور  </Link>
                    </div>
                    <div className={pathname === '/dashboard/policy' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/policy'} ><MdOutlinePolicy className={pathname === '/dashboard/policy' ? 'icon act' : 'icon'} />    السياسات  </Link>
                    </div>
                    <div className={pathname === '/dashboard/settings' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/settings'} ><IoSettingsOutline className={pathname === '/dashboard/settings' ? 'icon act' : 'icon'} />    الاعدادات  </Link>
                    </div>
                    <div className={'dash-link'} >
                        <IoIosLogOut className={'icon'} />
                        <a href="" onClick={handleLogout}>تسجيل خروج</a>
                    </div>
                </div>
            </nav>
        </div>
    );
}