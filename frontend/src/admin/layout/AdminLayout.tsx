import { Outlet } from 'react-router-dom';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="lg:ml-[290px]">
                <AdminHeader />

                <main className="mx-auto max-w-[1600px] p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}