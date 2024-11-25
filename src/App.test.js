import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page header', () => {
  render(<App />);
  // Use getByRole to target the heading
  const headerElement = screen.getByRole('heading', { name: /login/i });
  expect(headerElement).toBeInTheDocument();
});
