import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: () => '/',
}));

describe('Footer Component', () => {
    it('renders copyright text', () => {
        render(<Footer />);
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });

    it('renders brand name in footer', () => {
        render(<Footer />);
        expect(screen.getAllByText(/AptiArena/i).length).toBeGreaterThan(0);
    });

    it('contains essential links', () => {
        render(<Footer />);
        expect(screen.getByText(/Feedback/i)).toBeInTheDocument();
        expect(screen.getByText(/MIT License/i)).toBeInTheDocument();
        expect(screen.getByText(/Connect With Us/i)).toBeInTheDocument();
    });
});
