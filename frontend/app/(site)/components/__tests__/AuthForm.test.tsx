/**
 * TDD: AuthForm should surface the actual server validation error
 * (e.g. "password must be longer than or equal to 6 characters")
 * instead of a generic "Invalid credentials" toast.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '../AuthForm';
import { toast } from 'react-hot-toast';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRegister = jest.fn();
const mockLogin = jest.fn();
jest.mock('@/app/context/JwtAuthContext', () => ({
  useJwtAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    loginOAuth: jest.fn(),
    status: 'unauthenticated',
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthForm — register error handling', () => {
  it('shows the backend validation message when register returns 400', async () => {
    const user = userEvent.setup();
    // Backend returns axios-shaped error with array of validation messages
    mockRegister.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: ['password must be longer than or equal to 6 characters'],
        },
      },
    });

    render(<AuthForm />);

    // Switch to REGISTER variant
    await user.click(screen.getByText(/Create an account/i));

    await user.type(screen.getByLabelText(/Name/i), 'Tester');
    await user.type(screen.getByLabelText(/Email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/i), '123');
    await user.click(screen.getByRole('button', { name: /Register/i }));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/password must be longer than or equal to 6 characters/i),
    );
    // Should NOT show generic message
    expect(toast.error).not.toHaveBeenCalledWith('Invalid credentials');
  });

  it('shows the backend validation message when message is a plain string', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'Email already in use' },
      },
    });

    render(<AuthForm />);

    await user.click(screen.getByText(/Create an account/i));

    await user.type(screen.getByLabelText(/Name/i), 'Tester');
    await user.type(screen.getByLabelText(/Email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/i), 'longenough');
    await user.click(screen.getByRole('button', { name: /Register/i }));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/Email already in use/i),
    );
  });

  it('falls back to a generic message when the error has no response payload', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Network down'));

    render(<AuthForm />);

    await user.type(screen.getByLabelText(/Email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/Password/i), 'longenough');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(toast.error).toHaveBeenCalled();
    const calls = (toast.error as jest.Mock).mock.calls;
    expect(calls[calls.length - 1][0]).toMatch(/something went wrong|invalid|error/i);
  });
});
