import { render } from '@testing-library/react-native';

import { MetricCard } from '@/components/metric-card';

describe('MetricCard', () => {
  it('renders the label and value', () => {
    const screen = render(<MetricCard accent="#fff" label="Tasks tracked" value="28" />);
    expect(screen.getByText('Tasks tracked')).toBeTruthy();
    expect(screen.getByText('28')).toBeTruthy();
  });
});
