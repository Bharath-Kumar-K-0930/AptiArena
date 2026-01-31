import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: (props: any) => <div {...props} />,
        h1: (props: any) => <h1 {...props} />,
        h2: (props: any) => <h2 {...props} />,
        p: (props: any) => <p {...props} />,
        section: (props: any) => <section {...props} />,
        img: (props: any) => <img {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useScroll: () => ({ scrollYProgress: { onChange: jest.fn() } }),
    useTransform: () => ({}),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="icon-sparkles" />,
    Trophy: () => <div data-testid="icon-trophy" />,
    PlayCircle: () => <div data-testid="icon-playcircle" />,
    BarChart3: () => <div data-testid="icon-barchart3" />,
    Upload: () => <div data-testid="icon-upload" />,
    BrainCircuit: () => <div data-testid="icon-braincircuit" />,
    Users: () => <div data-testid="icon-users" />,
}));

describe('Home Page', () => {
    it('renders a heading', () => {
        render(<Home />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent(/Gamify Learning/i);
    });

    it('contains call to action', () => {
        render(<Home />);
        expect(screen.getByText(/Get Started for Free/i)).toBeInTheDocument();
    });
});
