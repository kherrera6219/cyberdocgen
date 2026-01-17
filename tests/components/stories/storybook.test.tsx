import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../../stories/Button';
import { Header } from '../../../stories/Header';
import { Page } from '../../../stories/Page';

describe('Storybook Components', () => {
    describe('Button', () => {
        it('renders with correct label and classes', () => {
            render(<Button label="Test Button" primary />);
            const btn = screen.getByRole('button');
            expect(btn).toHaveClass('storybook-button--primary');
            expect(btn).toHaveTextContent('Test Button');
        });

        it('renders secondary button', () => {
             render(<Button label="Secondary" />);
             const btn = screen.getByRole('button');
             expect(btn).toHaveClass('storybook-button--secondary');
        });

        it('handles clicks', () => {
            const onClick = vi.fn();
            render(<Button label="Click Me" onClick={onClick} />);
            fireEvent.click(screen.getByRole('button'));
            expect(onClick).toHaveBeenCalled();
        });

        it('applies custom background color', () => {
            render(<Button label="Color" backgroundColor="red" />);
            const btn = screen.getByRole('button');
            // Check style attribute directly to avoid RGB normalization issues or jest-dom trouble
             expect(btn.getAttribute('style')).toContain('background-color: red');
        });
        
        it('renders different sizes', () => {
             render(<Button label="Large" size="large" />);
             expect(screen.getByRole('button')).toHaveClass('storybook-button--large');
        });
    });

    describe('Header', () => {
        it('renders logged out state correctly', () => {
            const onLogin = vi.fn();
            const onCreate = vi.fn();
            render(<Header onLogin={onLogin} onCreateAccount={onCreate} />);
            
            expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
            expect(screen.getByText('Log in')).toBeInTheDocument();
            expect(screen.getByText('Sign up')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Log in'));
            expect(onLogin).toHaveBeenCalled();

            fireEvent.click(screen.getByText('Sign up'));
            expect(onCreate).toHaveBeenCalled();
        });

        it('renders logged in state correctly', () => {
            const onLogout = vi.fn();
            render(<Header user={{ name: 'Test User' }} onLogout={onLogout} />);
            
            expect(screen.getByText(/Welcome/)).toBeInTheDocument();
            expect(screen.getByText(/Test User/)).toBeInTheDocument();
            expect(screen.getByText('Log out')).toBeInTheDocument();
            
            expect(screen.queryByText('Log in')).not.toBeInTheDocument();

            fireEvent.click(screen.getByText('Log out'));
            expect(onLogout).toHaveBeenCalled();
        });
    });

    describe('Page', () => {
        it('manages login state', () => {
            render(<Page />);
            
            // Initially logged out
            expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
            
            // Log in
            fireEvent.click(screen.getByText('Log in'));
            expect(screen.getByText(/Welcome/)).toBeInTheDocument();
            expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
            
            // Log out
            fireEvent.click(screen.getByText('Log out'));
            expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
             
             // Sign up
            fireEvent.click(screen.getByText('Sign up'));
            expect(screen.getByText(/Welcome/)).toBeInTheDocument();
            expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
        });
        
        it('renders page content', () => {
            render(<Page />);
            expect(screen.getByText('Pages in Storybook')).toBeInTheDocument();
        });
    });
});
