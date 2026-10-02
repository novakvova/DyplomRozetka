import { Outlet } from 'react-router-dom';
import { AdminBackdrop } from './AdminBackdrop';

import {
    AdminSidebarProvider,
    useAdminSidebar,
} from '../context/AdminSidebarContext';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

function AdminLayoutContent() {
    const {
        isExpanded,
        isHovered,
        isMobileOpen,
    } = useAdminSidebar();

    const sidebarExpanded =
        isExpanded || isHovered;

    return (
        <div className="min-h-screen bg-gray-50 xl:flex">
            <AdminSidebar />
            <AdminBackdrop />

            <div
                className={`
                    flex-1 transition-[margin] duration-300 ease-in-out
                    ${
                        sidebarExpanded
                            ? 'xl:ml-[290px]'
                            : 'xl:ml-[90px]'
                    }
                    ${isMobileOpen ? 'ml-0' : ''}
                `}
            >
                <AdminHeader />

                <main className="mx-auto max-w-[1600px] p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function AdminLayout() {
    return (
        <AdminSidebarProvider>
            <AdminLayoutContent />
        </AdminSidebarProvider>
    );
}