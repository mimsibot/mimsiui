import { render } from '@testing-library/react-native';

import { StatusPill } from '@/components/status-pill';

describe('StatusPill', () => {
  it('renders uppercase status text', () => {
    const screen = render(<StatusPill text="active" tone="ok" />);
    expect(screen.getByText('active')).toBeTruthy();
  });
});
