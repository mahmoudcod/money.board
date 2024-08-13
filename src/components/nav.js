// Nave.js
'use client'
import React, { useState, useEffect, useRef } from 'react';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { data, loading, error } = useQuery(GET_LOGO);
    const appName = data?.logo?.data?.attributes?.appName || 'صناع المال';
    const sidebarRef = useRef(null);

    const handleSidebarToggle = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
    };

    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) return null;
    if (error) return null;

    return (
        <div className="dashboard">
            <button className="sidebar-toggle" onClick={handleSidebarToggle}>
                <IoIosMenu />
            </button>

            <nav ref={sidebarRef} className={`dashboard-nav ${isSidebarOpen ? 'open' : ''}`}>
                <div className="dash-logo">
                    <h1>{appName}</h1>
                </div>

                <div className="dash-links">
                    {[
                        { path: '/dashboard/posts', icon: FaChartSimple, text: 'مقالات' },
                        { path: '/dashboard/category', icon: BiCategory, text: 'التصنيفات' },
                        { path: '/dashboard/subCat', icon: BiCategory, text: 'التصنيفات الفرعية' },
                        { path: '/dashboard/tags', icon: BsTags, text: 'الكلمات الدليلية' },
                        { path: '/dashboard/users', icon: FaUsers, text: 'المستخدمين' },
                        { path: '/dashboard/contact', icon: LuMessagesSquare, text: 'رسائل تواصل معنا' },
                        { path: '/dashboard/commint', icon: LuMessagesSquare, text: 'التعليقات' },
                        { path: '/dashboard/images', icon: RiFolderImageLine, text: 'مكتبة الصور' },
                        { path: '/dashboard/policy', icon: MdOutlinePolicy, text: 'صفحات المواقع' },
                        { path: '/dashboard/settings', icon: IoSettingsOutline, text: 'الاعدادات' },
                    ].map((item, index) => (
                        <div key={index} className={pathname === item.path ? 'dash-link active' : 'dash-link'}>
                            <Link href={item.path} onClick={handleLinkClick}>
                                <item.icon className={pathname === item.path ? 'icon act' : 'icon'} />
                                {item.text}
                            </Link>
                        </div>
                    ))}
                    <div className={'dash-link'} >
                        <IoIosLogOut className={'icon'} />
                        <a href="" onClick={handleLogout}>تسجيل خروج</a>
                    </div>
                </div>
            </nav>
        </div>
    );
}