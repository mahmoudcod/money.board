// Nave.js
'use client'
import React, { useState, useEffect } from 'react';
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

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return null;
    if (error) return null;

    return (
        <div className="dashboard">
            <button className="sidebar-toggle" onClick={handleSidebarToggle}>
                <IoIosMenu />
            </button>

            <nav className={`dashboard-nav ${isSidebarOpen ? 'open' : ''}`}>
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

            {/* <style jsx>{`
                .dashboard {
                    position: relative;
                }

                .sidebar-toggle {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    z-index: 1000;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                }

                .dashboard-nav {
                    width: 250px;
                    height: 100vh;
                    background-color: #f0f0f0;
                    padding: 20px;
                    transition: transform 0.3s ease-in-out;
                }

                .dash-logo {
                    margin-bottom: 20px;
                }

                .dash-links {
                    display: flex;
                    flex-direction: column;
                }

                .dash-link {
                    margin-bottom: 10px;
                }

                .dash-link a {
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                    color: #333;
                }

                .icon {
                    margin-right: 10px;
                }

                .active a {
                    font-weight: bold;
                }

                @media (max-width: 768px) {
                    .dashboard-nav {
                        position: fixed;
                        top: 0;
                        left: 0;
                        transform: translateX(-100%);
                    }

                    .dashboard-nav.open {
                        transform: translateX(0);
                    }

                    .sidebar-toggle {
                        display: block;
                    }
                }

                @media (min-width: 769px) {
                    .sidebar-toggle {
                        display: none;
                    }

                    .dashboard-nav {
                        transform: translateX(0);
                    }
                }
            `}</style> */}
        </div>
    );
}