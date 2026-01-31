import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    usePathname: () => '/',
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        nav: (props: any) => <nav {...props} />,
        div: (props: any) => <div {...props} />,
        span: (props: any) => <span {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Navbar Component', () => {
    it('renders the brand name', () => {
        render(<Navbar />);
        expect(screen.getByText(/AptiArena/i)).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(<Navbar />);
        expect(screen.getByText(/Home/i)).toBeInTheDocument();
        expect(screen.getByText(/Explore Quizzes/i)).toBeInTheDocument();
        expect(screen.getByText(/Features/i)).toBeInTheDocument();
        expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
    });

    it('renders login and get started buttons when not authenticated', () => {
        // Clear localStorage to simulate non-authenticated state
        window.localStorage.clear();
        render(<Navbar />);
        expect(screen.getByText(/Login/i)).toBeInTheDocument();
        expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });
});
