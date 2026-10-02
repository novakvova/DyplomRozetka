import { useAdminSidebar } from '../context/AdminSidebarContext';

export function AdminBackdrop() {
    const {
        isMobileOpen,
        toggleMobileSidebar,
    } = useAdminSidebar();

    if (!isMobileOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden"
            onClick={toggleMobileSidebar}
            aria-hidden="true"
        />
    );
}