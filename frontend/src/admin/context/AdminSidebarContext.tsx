import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

type AdminSidebarContextType = {
    isExpanded: boolean;
    isMobileOpen: boolean;
    isHovered: boolean;

    toggleSidebar: () => void;
    toggleMobileSidebar: () => void;

    setIsHovered: (isHovered: boolean) => void;
    setIsMobileOpen: (open: boolean) => void;
};

const AdminSidebarContext =
    createContext<AdminSidebarContextType | undefined>(
        undefined,
    );

export function useAdminSidebar() {
    const context = useContext(
        AdminSidebarContext,
    );

    if (!context) {
        throw new Error(
            'useAdminSidebar must be used within AdminSidebarProvider',
        );
    }

    return context;
}

export function AdminSidebarProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [isExpanded, setIsExpanded] =
        useState(true);

    const [isMobileOpen, setIsMobileOpen] =
        useState(false);

    const [isMobile, setIsMobile] =
        useState(false);

    const [isHovered, setIsHovered] =
        useState(false);

    useEffect(() => {
        function handleResize() {
            const mobile =
                window.innerWidth < 1280;

            setIsMobile(mobile);

            if (!mobile) {
                setIsMobileOpen(false);
            }
        }

        handleResize();

        window.addEventListener(
            'resize',
            handleResize,
        );

        return () => {
            window.removeEventListener(
                'resize',
                handleResize,
            );
        };
    }, []);

    function toggleSidebar() {
        setIsExpanded(
            (previous) => !previous,
        );
    }

    function toggleMobileSidebar() {
        setIsMobileOpen(
            (previous) => !previous,
        );
    }

    return (
        <AdminSidebarContext.Provider
            value={{
                isExpanded:
                    isMobile
                        ? false
                        : isExpanded,

                isMobileOpen,
                isHovered,

                toggleSidebar,
                toggleMobileSidebar,

                setIsHovered,
                setIsMobileOpen,
            }}
        >
            {children}
        </AdminSidebarContext.Provider>
    );
}